from aws_cdk import (
    Stack, Duration, RemovalPolicy,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cognito as cognito,
    aws_lambda as _lambda,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_apigateway as apigw,
    aws_events as events,
    aws_events_targets as targets,
    aws_logs as logs,
    aws_kms as kms
)
from constructs import Construct

class ChurnGuardStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC
        vpc = ec2.Vpc(self, "ChurnVPC", max_azs=2)

        # KMS Key
        kms_key = kms.Key(self, "ChurnKey",
            description="ChurnGuard encryption key",
            removal_policy=RemovalPolicy.DESTROY
        )

        # S3 Bucket
        bucket = s3.Bucket(self, "ChurnBucket",
            bucket_name="churnguard-906989717040-prod",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ],
            removal_policy=RemovalPolicy.DESTROY
        )

        # RDS PostgreSQL
        db_instance = rds.DatabaseInstance(self, "ChurnDB",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            database_name="churn_predict",
            credentials=rds.Credentials.from_generated_secret("postgres"),
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # ElastiCache Redis
        redis_subnet_group = elasticache.CfnSubnetGroup(self, "RedisSubnetGroup",
            description="Subnet group for Redis",
            subnet_ids=[subnet.subnet_id for subnet in vpc.private_subnets]
        )

        redis_cluster = elasticache.CfnCacheCluster(self, "RedisCluster",
            cache_node_type="cache.t3.micro",
            engine="redis",
            num_cache_nodes=1,
            cache_subnet_group_name=redis_subnet_group.ref
        )

        # Cognito User Pool
        user_pool = cognito.UserPool(self, "ChurnUserPool",
            user_pool_name="churn-users",
            sign_in_aliases=cognito.SignInAliases(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        user_pool_client = cognito.UserPoolClient(self, "ChurnUserPoolClient",
            user_pool=user_pool,
            generate_secret=False,
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True
            )
        )

        # IAM Roles
        lambda_role = iam.Role(self, "ChurnLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3ReadOnlyAccess")
            ]
        )

        # Lambda Layer for ML libraries
        ml_layer = _lambda.LayerVersion(self, "MLLayer",
            code=_lambda.Code.from_asset("../backend/lambda_layer"),
            compatible_runtimes=[_lambda.Runtime.PYTHON_3_12],
            description="ML libraries layer"
        )

        # ML Inference Lambda
        ml_lambda = _lambda.Function(self, "MLInference",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="infer.handler",
            code=_lambda.Code.from_asset("../backend/lambda"),
            role=lambda_role,
            layers=[ml_layer],
            timeout=Duration.seconds(30),
            memory_size=1024,
            environment={
                "S3_BUCKET": bucket.bucket_name
            }
        )

        bucket.grant_read(ml_lambda)

        # ECS Cluster
        cluster = ecs.Cluster(self, "ChurnCluster", vpc=vpc)

        # Task Definition
        task_definition = ecs.FargateTaskDefinition(self, "ChurnTask",
            memory_limit_mib=2048,
            cpu=1024
        )

        container = task_definition.add_container("django",
            image=ecs.ContainerImage.from_asset("../backend"),
            memory_limit_mib=2048,
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="churn",
                log_retention=logs.RetentionDays.ONE_WEEK
            ),
            environment={
                "S3_BUCKET": bucket.bucket_name,
                "DB_HOST": db_instance.instance_endpoint.hostname
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=8000, protocol=ecs.Protocol.TCP)
        )

        # ECS Service
        service = ecs.FargateService(self, "ChurnService",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2
        )

        # API Gateway
        api = apigw.RestApi(self, "ChurnAPI",
            rest_api_name="ChurnGuard API",
            description="ChurnGuard REST API"
        )

        # EventBridge Rule for stream simulation
        rule = events.Rule(self, "StreamRule",
            schedule=events.Schedule.rate(Duration.seconds(10))
        )

        stream_lambda = _lambda.Function(self, "StreamGenerator",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="stream.handler",
            code=_lambda.Code.from_asset("../backend/lambda"),
            timeout=Duration.seconds(10),
            environment={
                "REDIS_URL": f"redis://{redis_cluster.attr_redis_endpoint_address}:6379"
            }
        )

        rule.add_target(targets.LambdaFunction(stream_lambda))
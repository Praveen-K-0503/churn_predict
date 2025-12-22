#!/usr/bin/env python3
import aws_cdk as cdk
from lib.churn_stack import ChurnGuardStack

app = cdk.App()
ChurnGuardStack(app, "ChurnGuardStack",
    env=cdk.Environment(
        account=906989717040,
        region=app.node.try_get_context("region") or "us-east-1"
    )
)

app.synth()
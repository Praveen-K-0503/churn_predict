from auth_app.models import CustomUser

# Create admin user
admin_user = CustomUser.objects.create_superuser(
    username='admin',
    email='admin@churnguard.com', 
    password='admin123',
    role='admin'
)
print(f"Created admin user: {admin_user.username}")

# Create manager user
manager_user = CustomUser.objects.create_user(
    username='manager',
    email='manager@churnguard.com',
    password='manager123', 
    role='manager'
)
print(f"Created manager user: {manager_user.username}")

print("ChurnGuard users created successfully!")
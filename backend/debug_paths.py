import os
import sys

# Ensure we can import app modules properly
sys.path.append(os.getcwd())

from app.services.excel_service import EXCEL_DIR, read_sheet

print(f"DEBUG: EXCEL_DIR identified by service: {EXCEL_DIR}")

# Check content of created tenant file
tenant_slug = "nutri-fernanda"
print(f"Reading users from {tenant_slug}...")
users = read_sheet(tenant_slug, "users")
print(f"Users found: {users}")

# Check Master
print("Reading master/users_master...")
master = read_sheet("master", "users_master")
print(f"Master count: {len(master)}")

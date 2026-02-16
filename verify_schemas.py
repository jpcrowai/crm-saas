import sys
import os
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from app.models import schemas
    print("Schemas imported successfully")
    # Try to access DashboardSummary
    print(f"DashboardSummary: {schemas.DashboardSummary}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

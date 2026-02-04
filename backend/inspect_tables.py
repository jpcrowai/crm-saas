from app.database import engine
from sqlalchemy import inspect
import sys

try:
    inspector = inspect(engine)
    for table_name in ['users', 'tenants']:
        columns = inspector.get_columns(table_name, schema='public')
        print(f"Columns for {table_name}:")
        for column in columns:
            print(f"  - {column['name']} ({column['type']})")
except Exception as e:
    print(f"Error: {e}")

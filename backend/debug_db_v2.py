from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
# Add timeout to connection
engine = create_engine(DATABASE_URL, connect_args={'connect_timeout': 10})

def inspect_db():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"TABLES_START")
        print(f"Tables: {','.join(tables)}")
        
        if "users" in tables:
            columns = inspector.get_columns("users")
            print("USERS_COLUMNS_START")
            for column in columns:
                print(f"COL:{column['name']}:{column['type']}")
        print(f"TABLES_END")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    inspect_db()

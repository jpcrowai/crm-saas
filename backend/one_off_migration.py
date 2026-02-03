from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        print("Adding contract_generated_url...")
        try:
            conn.execute(text("ALTER TABLE crm.tenants ADD COLUMN IF NOT EXISTS contract_generated_url TEXT"))
            conn.commit()
        except Exception as e:
            print(f"Error adding contract_generated_url: {e}")

        print("Adding contract_signed_url...")
        try:
            conn.execute(text("ALTER TABLE crm.tenants ADD COLUMN IF NOT EXISTS contract_signed_url TEXT"))
            conn.commit()
        except Exception as e:
            print(f"Error adding contract_signed_url: {e}")
        
    print("Migration finished!")

if __name__ == "__main__":
    migrate()

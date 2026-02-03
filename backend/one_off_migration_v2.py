from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        print("Adding modulos_habilitados column...")
        try:
            conn.execute(text("ALTER TABLE crm.tenants ADD COLUMN IF NOT EXISTS modulos_habilitados JSONB DEFAULT '[]'::jsonb"))
            conn.commit()
            print("Successfully added modulos_habilitados!")
        except Exception as e:
            print(f"Error adding modulos_habilitados: {e}")
        
    print("Migration finished!")

if __name__ == "__main__":
    migrate()

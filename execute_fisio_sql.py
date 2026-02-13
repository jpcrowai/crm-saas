"""
Executor direto do script SQL no Supabase
"""
import psycopg2
from psycopg2 import sql

# Credenciais do Supabase (usando pooler que sabemos que funciona)
DB_CONFIG = {
    "host": "aws-0-sa-east-1.pooler.supabase.com",
    "port": 6543,
    "database": "postgres",
    "user": "postgres.vmeerziytzluvqcijsib",
    "password": "CRMaster2026JP"
}

def execute_sql_file(filepath):
    """Executa um arquivo SQL no Supabase"""
    conn = None
    try:
        print("🔌 Conectando ao Supabase...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cur = conn.cursor()
        
        print("✅ Conexão estabelecida!")
        print(f"📄 Lendo arquivo: {filepath}")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        print("⚙️  Executando script SQL...")
        
        # Executar o script
        cur.execute(sql_script)
        
        # Commit
        conn.commit()
        
        print("\n" + "="*60)
        print("✨ SCRIPT EXECUTADO COM SUCESSO!")
        print("="*60)
        print("📧 Email: dra.silva@fisiolife.com.br")
        print("🔑 Senha: demo123")
        print("🏢 Ambiente: FisioLife - Clínica de Fisioterapia")
        print("🔗 Slug: fisiolife-demo")
        print("="*60)
        
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"\n❌ ERRO SQL: {e}")
        print(f"Código: {e.pgcode}")
        print(f"Detalhe: {e.pgerror}")
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {filepath}")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            cur.close()
            conn.close()
            print("\n🔌 Conexão fechada")

if __name__ == "__main__":
    execute_sql_file("CREATE_FISIOLIFE_DEMO.sql")

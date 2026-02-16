import psycopg2
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
database_url = os.getenv("DATABASE_URL")

def apply_indexes():
    try:
        conn = psycopg2.connect(database_url, sslmode='require')
        cursor = conn.cursor()
        
        print("🚀 Aplicando índices de performance...")
        
        indexes = [
            # Tabela leads_crm - Crucial para o Dashboard
            "CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON public.leads_crm (tenant_id, funil_stage);",
            "CREATE INDEX IF NOT EXISTS idx_leads_tenant_created ON public.leads_crm (tenant_id, created_at DESC);",
            
            # Tabela finance_entries - Crucial para Reports e Fluxo de Caixa
            "CREATE INDEX IF NOT EXISTS idx_finance_tenant_type_status ON public.finance_entries (tenant_id, type, status);",
            "CREATE INDEX IF NOT EXISTS idx_finance_due_date ON public.finance_entries (due_date DESC);",
            
            # Tabela users - Importante para autenticação e verificação de tenant
            "CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users (tenant_id);",
            
            # Tabela customers - Ranking e busca
            "CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers (tenant_id);"
        ]
        
        for sql in indexes:
            print(f"Executando: {sql}")
            cursor.execute(sql)
            
        conn.commit()
        print("\n✅ Índices aplicados com sucesso! A busca de dados agora será muito mais rápida.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ Erro ao aplicar índices: {e}")
        if 'conn' in locals():
            conn.rollback()

if __name__ == "__main__":
    apply_indexes()

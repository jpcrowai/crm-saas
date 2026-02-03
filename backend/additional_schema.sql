-- Additional Tables for CRM SaaS
-- Run this script AFTER database_schema.sql
-- EXCLUDES: appointments, n8n_chat_histories (User already has these)

-- 8. CUSTOMERS (Base de Clientes)
-- Separado de leads para conter dados fiscais e histórico formal
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    document VARCHAR(20), -- CPF/CNPJ
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PIPELINE STAGES (Etapas do Funil Personalizáveis)
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#000000',
    order_index INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SUBSCRIPTIONS (Assinaturas Recorrentes dos Clientes do Tenant)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- active, past_due, canceled, pending
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_billing_date DATE,
    cancellation_date DATE,
    price DECIMAL(12, 2) NOT NULL, -- Valor congelado da assinatura
    periodicity VARCHAR(20) DEFAULT 'monthly',
    contract_url TEXT, -- URL do PDF assinado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. INTEGRATIONS (Configurações de APIs Externas)
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google_calendar', 'whatsapp', 'openai'
    credentials JSONB, -- { "client_id": "...", "client_secret": "..." } ou API Keys (Criptografar no Back-end se possível)
    active BOOLEAN DEFAULT FALSE,
    settings JSONB, -- Configurações adicionais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, provider)
);

-- 12. NOTIFICATIONS (Notificações do Sistema)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, success, error
    link_url TEXT, -- Link para clicar e ir para a página relevant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

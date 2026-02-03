-- Database Schema for CRM SaaS
-- Generated based on Python models and Frontend definitions

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS (Ambientes)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL, -- nome_empresa
    business_name VARCHAR(255), -- Razão Social / nome
    document VARCHAR(20), -- CNPJ
    address TEXT, -- endereco
    niche_id VARCHAR(50), -- nicho_id
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0055FF',
    plan_tier VARCHAR(50) DEFAULT 'basic',
    payment_status VARCHAR(50) DEFAULT 'trial',
    contract_status VARCHAR(50) DEFAULT 'pending_generation',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS (Global & Tenant Users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for Master Superadmins
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- user, admin
    is_master BOOLEAN DEFAULT FALSE, -- Identifies global superadmins
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. LEADS (Clientes / Oportunidades)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, converted, lost
    value DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRODUCTS/SERVICES (Itens que compõem planos ou vendas avulsas)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PLANS (Planos de Assinatura criados pelo Tenant)
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(12, 2) NOT NULL,
    periodicity VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Relations between Plans and Products
CREATE TABLE plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER DEFAULT 1,
    frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, weekly, once
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. FINANCE CATEGORIES (Categorias de Receita/Despesa)
CREATE TABLE finance_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- entrada, saida, ambos
    active BOOLEAN DEFAULT TRUE
);

-- 7. FINANCE ENTRIES (Laçamentos Financeiros)
CREATE TABLE finance_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Opcional, vinculado a venda
    category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
    
    type VARCHAR(20) NOT NULL, -- receita, despesa
    description VARCHAR(255) NOT NULL,
    origin VARCHAR(50) DEFAULT 'avulso', -- avulso, venda
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, pago, atrasado
    payment_method VARCHAR(50),
    
    installment_number INTEGER DEFAULT 1,
    total_installments INTEGER DEFAULT 1,
    
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_finance_tenant_date ON finance_entries(tenant_id, due_date);

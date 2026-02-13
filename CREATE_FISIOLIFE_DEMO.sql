-- =====================================================
-- SCRIPT SQL PARA CRIAR AMBIENTE DEMO: FISIOLIFE
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 0. CRIAR NICHO DE FISIOTERAPIA
INSERT INTO public.niches (id, name, description, created_at)
VALUES (
    'a1510000-0000-0000-0000-000000000000',
    'Fisioterapia',
    'Clínicas de fisioterapia, RPG, Pilates e reabilitação física',
    NOW()
) ON CONFLICT DO NOTHING;

-- 1. CRIAR TENANT COM NICHO E MÓDULOS
INSERT INTO public.tenants (id, name, slug, niche_id, modulos_habilitados, created_at)
VALUES (
    'f15107ed-1234-5678-9abc-def012345678',
    'FisioLife - Clínica de Fisioterapia',
    'fisiolife-demo',
    'a1510000-0000-0000-0000-000000000000',
    '["dashboard", "leads_pipeline", "agenda", "clientes", "equipe", "financeiro", "produtos", "assinaturas"]'::jsonb,
    NOW()
) ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    niche_id = EXCLUDED.niche_id,
    modulos_habilitados = EXCLUDED.modulos_habilitados;

-- 2. CRIAR USUÁRIO ADMIN
-- Senha é "Admin@123" (hash pbkdf2 atualizado)
INSERT INTO public.users (id, email, password_hash, name, role, tenant_id, created_at)
VALUES (
    'a15107ed-1234-5678-9abc-def012345678',
    'dra.silva@fisiolife.com.br',
    '$pbkdf2-sha256$29000$O2fs/V9rwv9VRx880oLHZ9eI7eCcAh2XFAoaYY',
    'Dra. Maria Silva',
    'admin',
    'f15107ed-1234-5678-9abc-def012345678',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. CRIAR CATEGORIAS FINANCEIRAS
INSERT INTO public.finance_categories (id, name, type, tenant_id) VALUES
('c1510001-0000-0000-0000-000000000001', 'Consultas', 'receita', 'f15107ed-1234-5678-9abc-def012345678'),
('c1510002-0000-0000-0000-000000000002', 'Tratamentos', 'receita', 'f15107ed-1234-5678-9abc-def012345678'),
('c1510003-0000-0000-0000-000000000003', 'Pilates', 'receita', 'f15107ed-1234-5678-9abc-def012345678'),
('c1510004-0000-0000-0000-000000000004', 'RPG', 'receita', 'f15107ed-1234-5678-9abc-def012345678'),
('c1510005-0000-0000-0000-000000000005', 'Aluguel', 'despesa', 'f15107ed-1234-5678-9abc-def012345678'),
('c1510006-0000-0000-0000-000000000006', 'Equipamentos', 'despesa', 'f15107ed-1234-5678-9abc-def012345678'),
('c1510007-0000-0000-0000-000000000007', 'Materiais', 'despesa', 'f15107ed-1234-5678-9abc-def012345678'),
('c1510008-0000-0000-0000-000000000008', 'Marketing', 'despesa', 'f15107ed-1234-5678-9abc-def012345678');

-- 4. CRIAR CLIENTES (Pacientes)
INSERT INTO public.customers (id, name, email, phone, tenant_id, created_at) VALUES
(gen_random_uuid(), 'João Carlos Oliveira', 'joao.oliveira@email.com', '(11) 98765-4321', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'Ana Paula Santos', 'ana.santos@email.com', '(11) 97654-3210', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'Pedro Henrique Lima', 'pedro.lima@email.com', '(11) 96543-2109', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'Mariana Costa', 'mariana.costa@email.com', '(11) 95432-1098', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'Carlos Eduardo Souza', 'carlos.souza@email.com', '(11) 94321-0987', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'Juliana Ferreira', 'juliana.ferreira@email.com', '(11) 93210-9876', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'Roberto Alves', 'roberto.alves@email.com', '(11) 92109-8765', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'Fernanda Martins', 'fernanda.martins@email.com', '(11) 91098-7654', 'f15107ed-1234-5678-9abc-def012345678', NOW());

-- 5. CRIAR FORNECEDORES
INSERT INTO public.suppliers (id, name, email, phone, tenant_id, created_at) VALUES
(gen_random_uuid(), 'MedEquip - Equipamentos Médicos', 'vendas@medequip.com.br', '(11) 4000-1234', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'FisioSupply - Materiais', 'contato@fisiosupply.com.br', '(11) 4000-5678', 'f15107ed-1234-5678-9abc-def012345678', NOW()),
(gen_random_uuid(), 'Imobiliária Prime', 'locacao@primeimoveis.com.br', '(11) 4000-9012', 'f15107ed-1234-5678-9abc-def012345678', NOW());

-- 6. CRIAR LANÇAMENTOS FINANCEIROS (RECEITAS - últimos 60 dias)
DO $$
DECLARE
    customer_record RECORD;
    i INT;
    random_date DATE;
    random_service TEXT;
    random_amount NUMERIC;
    random_status TEXT;
    services TEXT[] := ARRAY['Avaliação Fisioterapêutica', 'Sessão de RPG', 'Sessão de Pilates', 'Fisioterapia Ortopédica', 'Fisioterapia Respiratória'];
    amounts NUMERIC[] := ARRAY[150.00, 180.00, 120.00, 160.00, 140.00];
    categories UUID[] := ARRAY['c1510001-0000-0000-0000-000000000001'::uuid, 'c1510004-0000-0000-0000-000000000004'::uuid, 'c1510003-0000-0000-0000-000000000003'::uuid, 'c1510002-0000-0000-0000-000000000002'::uuid, 'c1510002-0000-0000-0000-000000000002'::uuid];
    statuses TEXT[] := ARRAY['pago', 'pago', 'pago', 'pago', 'pago', 'pago', 'pago', 'pendente', 'pendente', 'atrasado'];
BEGIN
    FOR i IN 1..80 LOOP
        -- Selecionar cliente aleatório
        SELECT id INTO customer_record FROM public.customers 
        WHERE tenant_id = 'f15107ed-1234-5678-9abc-def012345678' 
        ORDER BY RANDOM() LIMIT 1;
        
        -- Data aleatória nos últimos 60 dias
        random_date := CURRENT_DATE - (RANDOM() * 60)::INT;
        
        -- Serviço aleatório
        random_service := services[1 + FLOOR(RANDOM() * 5)::INT];
        random_amount := amounts[1 + FLOOR(RANDOM() * 5)::INT];
        random_status := statuses[1 + FLOOR(RANDOM() * 10)::INT];
        
        INSERT INTO public.finance_entries (
            id, description, amount, due_date, status, type, category_id, customer_id, tenant_id, created_at
        ) VALUES (
            gen_random_uuid(),
            random_service,
            random_amount,
            random_date,
            random_status,
            'receita',
            categories[1 + FLOOR(RANDOM() * 5)::INT],
            customer_record.id,
            'f15107ed-1234-5678-9abc-def012345678',
            NOW()
        );
    END LOOP;
END $$;

-- 7. CRIAR LANÇAMENTOS FINANCEIROS (DESPESAS - últimos 60 dias)
DO $$
DECLARE
    supplier_record RECORD;
    i INT;
    random_date DATE;
    despesas TEXT[] := ARRAY['Aluguel do Espaço', 'Manutenção de Equipamentos', 'Material de Limpeza', 'Google Ads', 'Compra de Equipamentos'];
    amounts NUMERIC[] := ARRAY[3500.00, 450.00, 280.00, 600.00, 1200.00];
    categories UUID[] := ARRAY['c1510005-0000-0000-0000-000000000005'::uuid, 'c1510006-0000-0000-0000-000000000006'::uuid, 'c1510007-0000-0000-0000-000000000007'::uuid, 'c1510008-0000-0000-0000-000000000008'::uuid, 'c1510006-0000-0000-0000-000000000006'::uuid];
BEGIN
    FOR i IN 1..25 LOOP
        -- Selecionar fornecedor aleatório (pode ser NULL)
        IF RANDOM() > 0.3 THEN
            SELECT id INTO supplier_record FROM public.suppliers 
            WHERE tenant_id = 'f15107ed-1234-5678-9abc-def012345678' 
            ORDER BY RANDOM() LIMIT 1;
        ELSE
            supplier_record.id := NULL;
        END IF;
        
        random_date := CURRENT_DATE - (RANDOM() * 60)::INT;
        
        INSERT INTO public.finance_entries (
            id, description, amount, due_date, status, type, category_id, supplier_id, tenant_id, created_at
        ) VALUES (
            gen_random_uuid(),
            despesas[1 + FLOOR(RANDOM() * 5)::INT],
            amounts[1 + FLOOR(RANDOM() * 5)::INT],
            random_date,
            CASE WHEN RANDOM() > 0.2 THEN 'pago' ELSE 'pendente' END,
            'despesa',
            categories[1 + FLOOR(RANDOM() * 5)::INT],
            supplier_record.id,
            'f15107ed-1234-5678-9abc-def012345678',
            NOW()
        );
    END LOOP;
END $$;

-- =====================================================
-- CONCLUSÃO
-- =====================================================
SELECT 
    '✅ Ambiente FisioLife criado com sucesso!' as mensagem,
    'dra.silva@fisiolife.com.br' as email,
    'Admin@123' as senha,
    'fisiolife-demo' as slug;

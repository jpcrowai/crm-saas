-- =====================================================
-- SCRIPT DE ATUALIZAÇÃO: Adicionar Nicho e Módulos
-- Execute este script para atualizar o tenant existente
-- =====================================================

-- 1. CRIAR NICHO DE FISIOTERAPIA (se não existir)
INSERT INTO public.niches (id, name, description, created_at)
VALUES (
    'a1510000-0000-0000-0000-000000000000',
    'Fisiodiagnóstico',
    'Clínicas de fisioterapia, RPG, Pilates e reabilitação física',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. ATUALIZAR TENANT COM NICHO E MÓDULOS
UPDATE public.tenants
SET 
    niche_id = 'a1510000-0000-0000-0000-000000000000',
    modulos_habilitados = '["dashboard", "leads_pipeline", "agenda", "clientes", "equipe", "financeiro", "produtos", "assinaturas"]'::jsonb
WHERE slug = 'fisiolife-demo';

-- 3. VERIFICAR ATUALIZAÇÃO
SELECT 
    name,
    slug,
    niche_id,
    modulos_habilitados,
    '✅ Tenant atualizado com sucesso!' as status
FROM public.tenants
WHERE slug = 'fisiolife-demo';

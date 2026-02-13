-- SCRIPT DE MIGRAÇÃO: leads -> lead_crm
-- 1. Renomear tabela
ALTER TABLE public.leads RENAME TO lead_crm;

-- 2. Adicionar nova coluna (se não existir)
ALTER TABLE public.lead_crm ADD COLUMN IF NOT EXISTS funil_stage TEXT;

-- 3. Migrar dados da coluna status antiga para funil_stage
UPDATE public.lead_crm SET funil_stage = status WHERE funil_stage IS NULL;

-- 4. Remover coluna antiga (opcional, mas recomendado para limpar)
-- ALTER TABLE public.lead_crm DROP COLUMN status;

-- 5. Verificar migração
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'lead_crm' AND column_name IN ('funil_stage', 'status');

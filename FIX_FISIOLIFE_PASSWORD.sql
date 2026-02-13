-- =====================================================
-- SCRIPT DE CORREÇÃO: Reset de Senha Admin
-- =====================================================

-- Atualiza a senha da Dra. Maria Silva para "Admin@123"
UPDATE public.users
SET password_hash = '$pbkdf2-sha256$29000$O2fs/V9rwv9VRx880oLHZ9eI7eCcAh2XFAoaYY'
WHERE email = 'dra.silva@fisiolife.com.br';

-- Verifica se o usuário existe e está no tenant correto
SELECT 
    u.name, 
    u.email, 
    t.slug as ambiente,
    '✅ Senha resetada para Admin@123' as status
FROM public.users u
JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'dra.silva@fisiolife.com.br';

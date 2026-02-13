-- SCRIPT DE DIAGNÓSTICO DE LOGIN
SELECT 
    u.id as user_id,
    u.email,
    u.name as user_name,
    u.role,
    u.tenant_id,
    t.id as tenant_actual_id,
    t.slug,
    t.name as tenant_name,
    t.active as tenant_active,
    u.password_hash
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.email = 'dra.silva@fisiolife.com.br';

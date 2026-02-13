-- SCRIPT PARA IDENTIFICAR USUÁRIO MASTER
SELECT 
    name, 
    email, 
    role, 
    is_master,
    'Acesse o painel Master com este e-mail' as instrucao
FROM public.users 
WHERE is_master = true 
   OR role = 'master'
ORDER BY is_master DESC;

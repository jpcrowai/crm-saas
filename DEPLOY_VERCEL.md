# 🚀 Guia de Deploy no Vercel - CRM SaaS

Este guia explica como fazer deploy do frontend (React) e backend (FastAPI) no Vercel.

---

## 📋 Pré-requisitos

1. Conta no Vercel (https://vercel.com)
2. Vercel CLI instalado (opcional, mas recomendado):
   ```bash
   npm install -g vercel
   ```
3. Banco de dados PostgreSQL (Supabase, Railway, Neon, etc.)

---

## 🎨 Parte 1: Deploy do Frontend (React/Vite)

### Opção A: Deploy via Vercel Dashboard (Web)

1. **Acesse o Vercel Dashboard**:
   - Vá para https://vercel.com/new
   - Conecte sua conta GitHub/GitLab

2. **Importe o Repositório**:
   - Clique em "Import Project"
   - Selecione o repositório do seu projeto
   - **Root Directory**: Selecione `frontend`

3. **Configure o Build**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Variáveis de Ambiente**:
   Adicione as seguintes variáveis:
   ```
   VITE_API_URL=https://seu-backend.vercel.app
   ```

5. **Deploy**:
   - Clique em "Deploy"
   - Aguarde o build finalizar

### Opção B: Deploy via CLI

```bash
cd frontend
vercel

# Na primeira vez, responda:
# - Set up and deploy? Yes
# - Which scope? [sua conta]
# - Link to existing project? No
# - What's your project's name? crm-saas-frontend
# - In which directory is your code located? ./
# - Want to override settings? No

# Para deploys futuros:
vercel --prod
```

---

## ⚙️ Parte 2: Deploy do Backend (FastAPI)

### Opção A: Deploy via Vercel Dashboard (Web)

1. **Crie um Novo Projeto**:
   - Vá para https://vercel.com/new
   - Importe o mesmo repositório
   - **Root Directory**: Selecione `backend`

2. **Variáveis de Ambiente**:
   Adicione as seguintes variáveis (muito importante!):
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   SECRET_KEY=sua-chave-secreta-super-segura-aqui
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

3. **Deploy**:
   - Clique em "Deploy"
   - Vercel detectará automaticamente o Python e usará o `vercel.json`

### Opção B: Deploy via CLI

```bash
cd backend
vercel

# Na primeira vez:
# - Set up and deploy? Yes
# - Which scope? [sua conta]
# - Link to existing project? No
# - What's your project's name? crm-saas-backend
# - In which directory is your code located? ./

# Adicione variáveis de ambiente:
vercel env add DATABASE_URL
# Cole o valor: postgresql://...

vercel env add SECRET_KEY
# Cole uma chave secreta forte

# Deploy em produção:
vercel --prod
```

---

## 🔗 Parte 3: Conectar Frontend ao Backend

Após o deploy do backend, você receberá uma URL tipo:
```
https://crm-saas-backend.vercel.app
```

### Atualizar Frontend:

1. **Via Dashboard**:
   - Vá para o projeto do frontend no Vercel
   - Settings → Environment Variables
   - Edite `VITE_API_URL` para a URL do backend
   - Redeploy (Deployments → [...] → Redeploy)

2. **Via CLI**:
   ```bash
   cd frontend
   vercel env add VITE_API_URL production
   # Cole: https://crm-saas-backend.vercel.app
   
   vercel --prod
   ```

---

## 🗄️ Parte 4: Configurar Banco de Dados

### Supabase (Recomendado)

1. Crie projeto em https://supabase.com
2. Vá para Settings → Database
3. Copie a "Connection String" (URI mode)
4. Use como `DATABASE_URL` no backend

### Railway / Neon / Render

Similar ao Supabase - copie a connection string PostgreSQL.

---

## ✅ Checklist Final

- [ ] Frontend deployado e acessível
- [ ] Backend deployado e respondendo em `/` (retorna "CRM SaaS API is running")
- [ ] Variável `VITE_API_URL` configurada no frontend
- [ ] Variáveis `DATABASE_URL` e `SECRET_KEY` configuradas no backend
- [ ] Banco PostgreSQL criado e acessível
- [ ] CORS permitindo a URL do frontend
- [ ] Login funcionando (teste com usuário admin)

---

## 🐛 Troubleshooting

### Erro: "Network Error" no Frontend
- Verifique se `VITE_API_URL` está correto
- Verifique se o backend está respondendo (acesse a URL diretamente)
- Verifique CORS no backend (`allow_origins`)

### Erro: "Cannot connect to database"
- Verifique `DATABASE_URL` no backend
- Teste conexão localmente com a mesma URL
- Verifique IP whitelist no provedor do banco

### Erro: "Module not found" no Backend
- Verifique se `requirements.txt` está atualizado
- Force rebuild no Vercel (Deployments → [...] → Redeploy)

### Build falha no Frontend
- Verifique logs de build no Vercel
- Teste build local: `npm run build`
- Certifique-se que não há erros TypeScript/ESLint

---

## 📊 Monitoramento

Após deploy, monitore:
- **Logs**: Vercel Dashboard → seu projeto → Functions
- **Métricas**: Analytics tab
- **Errors**: Vercel mostra erros em tempo real

---

## 🔐 Segurança em Produção

1. **Gere uma SECRET_KEY forte**:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

2. **Configure CORS específico**:
   Em `backend/app/main.py`, substitua:
   ```python
   allow_origins=["https://seu-frontend.vercel.app"]
   ```

3. **Use HTTPS apenas** (Vercel já fornece)

4. **Proteja variáveis** sensíveis no Vercel (nunca commite .env)

---

## 🎉 Pronto!

Seu CRM SaaS está no ar! 

- **Frontend**: https://seu-projeto.vercel.app
- **Backend**: https://seu-backend.vercel.app

Para atualizações futuras, basta fazer push no Git ou usar `vercel --prod`.

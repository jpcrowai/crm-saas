# Monitor de IA: Guia de Integração com n8n

Este documento descreve como configurar seus fluxos no **n8n** para que eles atualizem o **Monitor de IA** da plataforma em tempo real. A plataforma funciona como uma central de comando onde você vê o status de todos os robôs em execução.

---

## Como Funciona

Sempre que o robô (n8n) avançar de etapa no WhatsApp ou no Instagram, ele deve enviar um "Sinal de Vida" (Telemetry) para o backend do SaaS. Esse sinal faz com que a interface do usuário pisque e mostre as barras de progresso ao vivo.

Tudo o que você precisa fazer é adicionar os nós **HTTP Request** descritos abaixo nos seus fluxos do n8n. **Você não precisa mudar a lógica do seu robô, apenas pendurar esses nós para enviar alertas.**

---

## 1. O "Grito de Guerra" (Início do Fluxo)

Logo após o nó de "Gatilho" (ex: Webhook recebendo nova mensagem), adicione um **HTTP Request**.

*   **Método:** `POST`
*   **URL:** `https://SUA_API_URL/tenant/bot/telemetry` *(Em ambiente local, use `http://localhost:8000/tenant/bot/telemetry`)*
*   **Authentication:** Caso use autenticação, passe o token Bearer.
*   **Body (JSON Raw):**

```json
{
  "tenant_id": "{{ ID_DO_CLIENTE }}", 
  "customer_name": "{{ NOME_DO_CONTATO_WHATSAPP }}",
  "status": "active",
  "current_step": "Coletando Dados Iniciais",
  "progress": 10,
  "message": "Olá! Sou a assistente virtual..."
}
```

*   **O que acontece na Plataforma:** O card azul "Em Curso" aparece na aba Monitor de IA, mostrando "10%" na barra de progresso.

---

## 2. Os "Checkpoints" (Meio do Caminho)

Sempre que uma etapa importante terminar (ex: "Coletou o CPF" ou "Validou a Agenda"), adicione outro nó **HTTP Request**.

*   **Método:** `POST`
*   **URL:** `https://SUA_API_URL/tenant/bot/telemetry`
*   **Body (JSON Raw):**

```json
{
  "tenant_id": "{{ ID_DO_CLIENTE }}",
  "customer_name": "{{ NOME_DO_CONTATO_WHATSAPP }}",
  "status": "active",
  "current_step": "Aguardando confirmação de horário",
  "progress": 60,
  "message": "Qual desses horários prefere: 14h ou 15h?"
}
```

*   **O que acontece na Plataforma:** O progress bar daquele cliente específico pula para 60% em tempo real e o texto é atualizado.

---

## 3. O "Descanse em Paz" (Fim do Fluxo / Transferência Humana)

Quando a conversa terminar com sucesso ou quando o bot precisar "chamar um humano", adicione este último **HTTP Request** antes do fluxo encerrar de vez.

*   **Método:** `POST`
*   **URL:** `https://SUA_API_URL/tenant/bot/telemetry`
*   **Body (JSON Raw):**

```json
{
  "tenant_id": "{{ ID_DO_CLIENTE }}",
  "customer_name": "{{ NOME_DO_CONTATO_WHATSAPP }}",
  "status": "completed", 
  "current_step": "Finalizado - Encaminhado para Humano",
  "progress": 100,
  "message": "Vou chamar um atendente humano para você."
}
```

*   **O que acontece na Plataforma:** A barra enche 100%, o card fica cinza com o selo de "Finalizado". Opcionalmente, pode-se enviar `"status": "failed"` caso o robô tenha quebrado.

---

## 4. Automações Master (Eventos do Sistema)

Quando você cria um novo ambiente no Painel Master, o sistema agora dispara um webhook automático para o n8n. Isso permite que você automatize o envio de e-mails de boas-vindas com as credenciais de acesso.

### Ação: Novo Ambiente Criado

*   **URL de Destino:** Definida na variável de ambiente `N8N_MASTER_WEBHOOK_URL` no backend.
*   **Método:** `POST`
*   **Payload Recebido pelo n8n:**

```json
{
  "event": "environment_created",
  "company_name": "NOME_DA_EMPRESA",
  "admin_email": "EMAIL_DO_ADMIN",
  "admin_password": "SENHA_PROVISORIA",
  "slug": "SLUG_DO_AMBIENTE",
  "login_url": "URL_DE_LOGIN_DIRETO"
}
```

**Fluxo Recomendado no n8n:**
1.  **Webhook Trigger** (Recebe o payload acima).
2.  **Gmail/Outlook Node** (Envia o e-mail para `admin_email` usando um template bonito).
3.  *(Opcional)* **Slack/Discord Node** (Notifica sua equipe interna sobre a nova venda).

---

## Dicas Adicionais

1.  **Mapear o ID do Lead (`lead_id`):** Opcionalmente, se o bot já sabe o ID do Lead no seu CRM, você pode enviar o campo `"lead_id": "UU-ID..."` no JSON acima, isso garante um tracking ainda mais preciso na tela do usuário.
2.  **Múltiplos Clientes:** Lembre-se que um único fluxo no n8n pode atender vários Tenants (clientes seus). Use as variáveis do próprio n8n para preencher o `"tenant_id"` dinamicamente.

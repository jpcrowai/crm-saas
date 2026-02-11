# Módulo de Profissionais

## Visão Geral
O módulo de Profissionais permite gerenciar especialistas da sua equipe (médicos, dentistas, designers, consultores, etc.) com Interface moderna em cards e modal de detalhes completo.

## Funcionalidades

### ✅ Grid de Cards Premium
- Cards responsivos com foto do profissional
- Placeholder com iniciais caso não tenha foto
- Badge de especialidade
- Informações de contato visíveis
- Efeito hover elegante

### ✅ Modal de Criação
- Formulário completo para cadastro
- Campos: Nome, E-mail, Telefone, Especialidade, URL da Foto, Biografia
- Validações de campos obrigatórios

### ✅ Modal de Detalhes
- Visualização completa dos dados
- Foto em destaque
- Informações organizadas em seções
- Modo edição inline
- Opção de remover profissional

## Campos do Profissional

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | Sim | Nome completo do profissional |
| email | string | Não | E-mail de contato |
| phone | string | Não | Telefone de contato |
| specialty | string | Não | Especialidade/área de atuação |
| photo_url | string | Não | URL da foto do profissional |
| bio | text | Não | Biografia/descrição do profissional |
| active | boolean | Sim | Status ativo/inativo (padrão: true) |

## Acesso

**Rota:** `/professionals`  
**Módulo Necessário:** `equipe`  
**Menu:** Sidebar > Profissionais

## API Endpoints

```
GET    /tenant/professionals/         - Lista todos os profissionais
GET    /tenant/professionals/{id}     - Busca um profissional específico
POST   /tenant/professionals/         - Cria novo profissional
PUT    /tenant/professionals/{id}     - Atualiza profissional
DELETE /tenant/professionals/{id}     - Remove profissional (soft delete)
```

## Design System

### Cores
- Header do card: Gradiente navy (--grad-navy)
- Foto placeholder: Dourado (--gold-500)
- Badge de especialidade: Ouro claro (--gold-50) com borda dourada
- Hover: Borda dourada (--gold-400)

### Animações
- Hover nos cards: translateY(-8px) + shadow premium
- Transições suaves em todos os elementos
- Modal com backdrop blur

## Exemplo de Uso

1. Acesse o menu **Profissionais** na sidebar
2. Clique em **Adicionar Profissional**
3. Preencha os dados e salve
4. Clique em um card para ver detalhes completos
5. No modal de detalhes, clique em **Editar** para modificar
6. Use o botão **Remover** para desativar o profissional

## Estados da Interface

### Loading State
- Ícone de usuários com mensagem "Carregando profissionais..."

### Empty State
- Ícone grande de usuários
- Mensagem "Nenhum profissional cadastrado"
- Botão de ação para adicionar o primeiro profissional

### Grid View
- Cards distribuídos em grid responsivo
- Mínimo 320px por card
- Gap de 2rem entre cards

## Responsividade

- **Desktop:** Grid de 3-4 colunas
- **Tablet:** Grid de 2 colunas
- **Mobile:** Grid de 1 coluna
- Modais adaptam largura em telas pequenas

## Integração com Outros Módulos

Os profissionais podem ser utilizados em:
- **Agenda:** Vincular profissional a agendamentos
- **Serviços:** Associar profissional a serviços específicos
- **Relatórios:** Análise de performance por profissional

## Próximos Passos Sugeridos

1. **Upload de Foto:** Implementar upload direto de imagens
2. **Horários de Trabalho:** Adicionar configuração de disponibilidade
3. **Agenda Integrada:** Visualizar agendamentos do profissional
4. **Avaliações:** Sistema de avaliação de clientes
5. **Comissões:** Cálculo de comissionamento por profissional

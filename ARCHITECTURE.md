# Arquitetura do Despesify

## 📐 Visão Geral

O Despesify é uma aplicação monorepo composta por três partes principais:

```
┌─────────────────────────────────────────────┐
│           Browser / Mobile App              │
│  (Web React / React Native)                 │
└────────────────┬────────────────────────────┘
                 │
                 │ HTTP/REST
                 │
┌────────────────▼────────────────────────────┐
│         API Backend (Express)               │
│  ┌────────────────────────────────────────┐ │
│  │  Routes, Controllers, Middleware       │ │
│  └────────────────────────────────────────┘ │
└────────────────┬────────────────────────────┘
                 │
                 │ MongoDB Driver
                 │
┌────────────────▼────────────────────────────┐
│          MongoDB Database                   │
│  ┌────────────────────────────────────────┐ │
│  │  Users, Expenses, SharedExpenses       │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 🏗️ Estrutura de Diretórios

```
despesify/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── models/          # MongoDB schemas
│   │   │   │   ├── User.js      # Modelo do usuário
│   │   │   │   ├── Expense.js   # Modelo da despesa
│   │   │   │   └── SharedExpense.js
│   │   │   ├── controllers/     # Lógica de negócio
│   │   │   │   ├── authController.js
│   │   │   │   └── expenseController.js
│   │   │   ├── routes/          # Endpoints da API
│   │   │   │   ├── auth.js
│   │   │   │   └── expenses.js
│   │   │   ├── middleware/      # Autenticação, validação
│   │   │   │   └── auth.js
│   │   │   └── index.js         # Entrada do servidor
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── pages/           # Páginas da aplicação
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── ExpensesPage.jsx
│   │   │   │   └── StatsPage.jsx
│   │   │   ├── components/      # Componentes reutilizáveis
│   │   │   │   ├── Layout.jsx
│   │   │   │   └── Navigation.jsx
│   │   │   ├── services/        # API calls
│   │   │   │   └── api.js
│   │   │   ├── store/           # State management (Zustand)
│   │   │   │   ├── authStore.js
│   │   │   │   └── expenseStore.js
│   │   │   ├── App.jsx
│   │   │   ├── main.jsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── mobile/
│       ├── src/
│       │   ├── screens/         # Telas do app
│       │   │   ├── LoginScreen.jsx
│       │   │   ├── DashboardScreen.jsx
│       │   │   ├── ExpensesScreen.jsx
│       │   │   └── StatsScreen.jsx
│       │   ├── services/        # API calls
│       │   │   └── api.js
│       │   ├── store/           # State management (Zustand)
│       │   │   ├── authStore.js
│       │   │   └── expenseStore.js
│       │   └── App.jsx
│       ├── index.js
│       ├── app.json
│       └── package.json
│
├── README.md                    # Documentação principal
├── QUICKSTART.md               # Guia de início rápido
├── COMMANDS.md                 # Comandos úteis
├── ARCHITECTURE.md             # Este arquivo
├── .gitignore
└── package.json                # Root monorepo config
```

## 🔐 Fluxo de Autenticação

```
Usuario                Frontend              Backend              Database
   │                      │                     │                    │
   ├─ Email + Senha ─────>│                     │                    │
   │                      │── POST /auth/register ──>│               │
   │                      │                     │    │ Hash password  │
   │                      │                     │    ├─────────────>│
   │                      │                     │    │ Salvar user   │
   │                      │                     │<──────────────────│
   │                      │                     │    JWT Token       │
   │<───── Token + User ───────────────────────│                    │
   │                      │                     │                    │
   │ (Token armazenado)   │                     │                    │
   │                      │                     │                    │
   ├─ Requisição + Token ─>│                     │                    │
   │                      │─ GET /expenses ────>│                    │
   │                      │    (Bearer token)   │ Verificar JWT      │
   │                      │                     ├─ Decodificar ID    │
   │                      │                     ├─ Listar despesas   │
   │                      │                     │<───────────────────│
   │                      │                     │ Dados do user      │
   │<────── Despesas ───────────────────────────│                    │
   │                      │                     │                    │
```

## 📊 Fluxo de Dados das Despesas

```
1. CREATE
┌───────┬─────────────────────────────────────┐
│ User  │ POST /expenses                      │
│ Input │ {description, amount, category...} │
└───────┴────────┬────────────────────────────┘
                 │
            ┌────▼────┐
            │Controller│ Valida dados
            └────┬────┘
                 │
            ┌────▼────┐
            │  Model   │ Cria documento
            └────┬────┘
                 │
            ┌────▼─────────┐
            │   Database   │ Salva em MongoDB
            └────┬─────────┘
                 │
            ┌────▼──────────┐
            │ Retorna: 201  │ Expense criada
            └───────────────┘

2. READ
┌───────────────────────────┐
│ GET /expenses?category=... │
└────────┬──────────────────┘
         │
    ┌────▼────┐
    │Controller│ Filtra
    └────┬────┘
         │
    ┌────▼────┐
    │  Query   │ MongoDB find()
    └────┬────┘
         │
    ┌────▼──────────┐
    │  Retorna: 200 │ Array de expenses
    └───────────────┘

3. UPDATE
┌──────────────────────────────┐
│ PUT /expenses/:id            │
│ {novo description, amount...}│
└────────┬─────────────────────┘
         │
    ┌────▼──────┐
    │ Controller │ Valida
    └────┬──────┘
         │
    ┌────▼──────┐
    │ findByIdAndUpdate │
    └────┬──────┘
         │
    ┌────▼───────────┐
    │  Retorna: 200  │ Expense atualizada
    └────────────────┘

4. DELETE
┌──────────────────┐
│ DELETE /expenses/:id│
└────────┬──────────┘
         │
    ┌────▼──────┐
    │ findByIdAndDelete │
    └────┬──────┘
         │
    ┌────▼───────────┐
    │  Retorna: 200  │ Deletada
    └────────────────┘
```

## 🔄 Estado da Aplicação (Frontend)

### Zustand Store Structure

```javascript
// authStore
{
  token: string | null,
  user: {
    id: string,
    name: string,
    email: string,
    currency: string
  } | null,
  setToken(),
  setUser(),
  logout()
}

// expenseStore
{
  expenses: Array<Expense>,
  stats: {
    totalSpent: number,
    byCategory: Object,
    byPaymentMethod: Object,
    count: number
  },
  setExpenses(),
  setStats(),
  addExpense(),
  updateExpense(),
  removeExpense()
}
```

## 🌐 Rotas da API

```
Autenticação
├── POST   /auth/register      → Criar conta
└── POST   /auth/login         → Fazer login

Despesas (requer autenticação)
├── GET    /expenses           → Listar despesas
├── GET    /expenses/:id       → Obter uma despesa
├── GET    /expenses/stats     → Estatísticas
├── POST   /expenses           → Criar despesa
├── PUT    /expenses/:id       → Atualizar despesa
└── DELETE /expenses/:id       → Deletar despesa

Futuro
├── POST   /expenses/:id/receipt → Upload de recibo
├── POST   /shared-expenses    → Compartilhar despesa
└── GET    /shared-expenses    → Listar compartilhadas
```

## 💾 Modelos de Dados

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  currency: String (default: 'BRL'),
  createdAt: Date
}
```

### Expense
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref User),
  description: String,
  amount: Number,
  category: String, // Alimentação, Transporte, etc
  date: Date,
  paymentMethod: String, // Dinheiro, Cartão, PIX, etc
  receipt: String (URL opcional),
  notes: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### SharedExpense
```javascript
{
  _id: ObjectId,
  expenseId: ObjectId (ref Expense),
  createdBy: ObjectId (ref User),
  participants: [{
    userId: ObjectId,
    share: Number,
    status: String // pending, paid, rejected
  }],
  totalAmount: Number,
  description: String,
  createdAt: Date
}
```

## 🔌 Middleware

```
Request
   │
   ├─ CORS (habilitado)
   ├─ JSON Parser
   ├─ URL Encoded Parser
   ├─ Auth Middleware (para rotas protegidas)
   │  ├─ Extrair JWT
   │  ├─ Verificar assinatura
   │  └─ Decodificar usuário
   │
   ├─ Route Handler
   │  └─ Controller
   │
   ├─ Error Handler
   └─ 404 Handler

Response
```

## 🚀 Fluxo de Deploy

```
Local Development
    ↓
Git Commit & Push
    ↓
CI/CD Pipeline (opcional)
    ↓
├─ Backend → Heroku/Railway
├─ Web → Vercel/Netlify
└─ Mobile → App Store/Google Play (via EAS)
    ↓
Production
```

## 🔐 Segurança

- **Senhas**: Bcrypt com salt 10
- **JWT**: Token com expiração de 7 dias
- **CORS**: Habilitado para desenvolvimento
- **Validação**: Joi (quando implementado)
- **Input Sanitization**: Implemente conforme necessário

## 📈 Escalabilidade

- **Backend**: Stateless (pode usar load balancer)
- **Database**: MongoDB indexação recomendada
- **Cache**: Implementar Redis para stats
- **CDN**: Usar para arquivos estáticos no web
- **Queue**: Implementar Bull para processamento async

## 🧪 Testes Recomendados

```
Backend
├── Unit Tests (Controllers, Models)
├── Integration Tests (API endpoints)
└── E2E Tests (fluxos completos)

Frontend/Mobile
├── Component Tests
├── Integration Tests
└── E2E Tests (Cypress, Detox)
```

## 📝 Melhorias Futuras

1. **Recibos**
   - Upload de fotos
   - OCR para extração de dados
   - Armazenamento em S3

2. **Compartilhamento**
   - Split de despesas
   - Cálculo de reembolsos
   - Notificações de pagamento

3. **Analytics**
   - Dashboard com KPIs
   - Previsões de gastos
   - Alertas de limite de orçamento

4. **Offline**
   - Sincronização offline-first
   - Local storage para dados

5. **Integrações**
   - Conexão com bancos
   - APIs de câmbio
   - Exportação automática

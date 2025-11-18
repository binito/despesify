# Despesify

Uma aplicação completa de gerenciamento de despesas, similar ao Expensify, com versões web e mobile.

## 🚀 Funcionalidades

- **Gerenciamento de Despesas**: Adicione, edite e delete despesas com facilidade
- **Categorização**: Organize suas despesas por categorias predefinidas
- **Estatísticas e Gráficos**: Visualize seus gastos através de gráficos e relatórios
- **Autenticação Segura**: Sistema de login e registro com JWT
- **Multi-plataforma**: Use no web, Android e iOS
- **Sincronização**: Todos os seus dados sincronizados na nuvem

## 📁 Estrutura do Projeto

```
despesify/
├── packages/
│   ├── backend/         # API Node.js + Express
│   ├── web/            # Front-end React
│   └── mobile/         # App React Native
├── README.md
└── package.json
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Criptografia de senhas

### Web
- **React** - Library UI
- **Vite** - Build tool
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **Chart.js** - Gráficos
- **Zustand** - State management
- **Axios** - HTTP client

### Mobile
- **React Native** - Framework mobile
- **Expo** - Plataforma para React Native
- **React Navigation** - Navegação
- **React Native Paper** - Componentes UI
- **Zustand** - State management

## 📦 Instalação

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- MongoDB

### 1. Backend

```bash
cd packages/backend
npm install
cp .env.example .env
# Configure seu banco de dados no .env
npm run dev
```

### 2. Frontend Web

```bash
cd packages/web
npm install
npm run dev
# Abre em http://localhost:3000
```

### 3. App Mobile

```bash
cd packages/mobile
npm install
npm start
# Escaneie o QR code com o Expo Go no seu telefone
```

## 📚 API Endpoints

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login

### Despesas
- `GET /expenses` - Listar despesas
- `GET /expenses/:id` - Obter despesa específica
- `POST /expenses` - Criar despesa
- `PUT /expenses/:id` - Atualizar despesa
- `DELETE /expenses/:id` - Deletar despesa
- `GET /expenses/stats` - Obter estatísticas

## 🔐 Autenticação

O sistema utiliza JWT para autenticação. Toda requisição para endpoints protegidos deve incluir:

```
Authorization: Bearer {token}
```

## 📝 Variáveis de Ambiente

### Backend (.env)
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/despesify
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

## 🎯 Funcionalidades Futuras

- [ ] Upload de recibos (fotos)
- [ ] Compartilhamento de despesas com outras pessoas
- [ ] Cálculo automático de reembolsos
- [ ] Exportação em PDF
- [ ] Suporte a múltiplas moedas
- [ ] Sincronização offline

## 👨‍💻 Desenvolvedor

Despesify foi criado para ajudá-lo a gerenciar suas despesas de forma inteligente e fácil.

## 📄 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para abrir issues e pull requests.

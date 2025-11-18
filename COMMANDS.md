# Comandos Úteis - Despesify

## Executar Tudo em Desenvolvimento

```bash
# Terminal 1: Backend
cd packages/backend && npm run dev

# Terminal 2: Frontend Web
cd packages/web && npm run dev

# Terminal 3: Mobile (opcional)
cd packages/mobile && npm start
```

## Backend

```bash
# Instalar dependências
cd packages/backend && npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Testes
npm test

# Health check
curl http://localhost:3001/health
```

## Frontend Web

```bash
# Instalar dependências
cd packages/web && npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Mobile

```bash
# Instalar dependências
cd packages/mobile && npm install

# Iniciar Expo
npm start

# Abrir no Android Emulator
npm run android

# Abrir no iOS Simulator (Mac only)
npm run ios

# Abrir no Web
npm run web

# Eject (cuidado - irreversível!)
npm run eject
```

## Git

```bash
# Inicializar repositório
git init

# Ver status
git status

# Adicionar arquivos
git add .

# Fazer commit
git commit -m "mensagem"

# Ver histórico
git log

# Criar branch
git checkout -b feature/nome

# Voltar para main
git checkout main

# Mergear branch
git merge feature/nome
```

## Testing & Linting

```bash
# Backend - testes
cd packages/backend && npm test

# Web - testes
cd packages/web && npm test

# Linting (quando configurado)
npm run lint
npm run lint:fix
```

## Database (MongoDB)

```bash
# Iniciar MongoDB
mongod

# Acessar MongoDB CLI
mongo

# Listar bancos
show dbs

# Usar banco
use despesify

# Listar collections
show collections

# Consultar dados
db.users.find()
db.expenses.find()

# Contar documentos
db.expenses.countDocuments()

# Deletar tudo (cuidado!)
db.expenses.deleteMany({})
```

## Endpoints para Testar

### Autenticação
```bash
# Registrar
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João",
    "email": "joao@example.com",
    "password": "senha123",
    "passwordConfirm": "senha123"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### Despesas
```bash
# Listar (precisa de token)
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/expenses

# Criar
curl -X POST http://localhost:3001/expenses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Almoço",
    "amount": 35.90,
    "category": "Alimentação"
  }'

# Estatísticas
curl -H "Authorization: Bearer {token}" \
  http://localhost:3001/expenses/stats
```

## Variáveis de Ambiente

### Backend
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/despesify
JWT_SECRET=seu_secret_aqui
JWT_EXPIRE=7d
NODE_ENV=development
```

### Frontend Web (.env)
```
VITE_API_URL=http://localhost:3001
```

### Mobile (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Tamanho do Projeto

```bash
# Ver tamanho de cada pasta
du -sh packages/*

# Ver total
du -sh .

# Contar linhas de código
find . -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -1
```

## Deploy Rápido

```bash
# Backend no Railway
npm install -g railway
railway login
cd packages/backend
railway init
railway up

# Web no Vercel
npm install -g vercel
cd packages/web
vercel

# Mobile no EAS
eas build --platform all
```

## Debugging

```bash
# Backend - modo debug
NODE_DEBUG=* npm run dev

# Chrome DevTools para Node
node --inspect src/index.js

# Ver logs
tail -f logs/*.log

# Limpar cache
rm -rf node_modules
rm package-lock.json
npm install
```

## Performance

```bash
# Análise de bundle web
npm run build
npx bundle-analyzer

# Performance backend
npm install clinic
clinic doctor -- npm run dev
```

# Checklist de Instalação e Setup - Despesify

## ✅ Pré-Requisitos

- [ ] Node.js 16+ instalado
- [ ] npm ou yarn instalado
- [ ] Git instalado
- [ ] MongoDB instalado (local ou conta em cloud)
- [ ] Editor de código (VS Code, WebStorm, etc)
- [ ] Git configurado (user.name, user.email)

## ✅ Clonar/Preparar o Projeto

```bash
# Se clonar do GitHub
git clone https://github.com/usuario/despesify.git
cd despesify

# Se já tem o projeto local
cd despesify
```

## ✅ Backend Setup

### 1. Instalação
```bash
cd packages/backend

# Instalar dependências
npm install

# Verificar se foi bem
npm list
```

### 2. Configuração
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais
# Abrir em seu editor favorito
cat .env
```

### 3. Banco de Dados
```bash
# Opção 1: MongoDB local
# Verificar se está rodando
mongo --version

# Se não tiver, instalar conforme seu SO
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb
# Windows: https://www.mongodb.com/try/download/community

# Iniciar MongoDB
mongod

# Testar conexão em outro terminal
mongo
> show dbs
> exit
```

```bash
# Opção 2: MongoDB Cloud (Atlas)
# 1. Criar conta em https://www.mongodb.com/cloud/atlas
# 2. Criar cluster
# 3. Copiar connection string
# 4. Cole em MONGODB_URI no .env
```

### 4. Iniciar Backend
```bash
npm run dev

# Esperado:
# ✓ MongoDB conectado
# 🚀 Servidor rodando em http://localhost:3001
```

### 5. Testar API
```bash
# Em outro terminal
curl http://localhost:3001/health

# Esperado:
# {"status":"ok","timestamp":"2024-..."}
```

- [ ] Dependências instaladas
- [ ] .env configurado
- [ ] MongoDB conectado
- [ ] Servidor rodando na porta 3001
- [ ] Health check retorna OK

## ✅ Frontend Web Setup

### 1. Instalação
```bash
cd packages/web

# Instalar dependências
npm install

# Verificar se foi bem
npm list
```

### 2. Configuração de Variáveis (opcional)
```bash
# Criar arquivo .env (opcional, padrão é localhost:3001)
echo "VITE_API_URL=http://localhost:3001" > .env
```

### 3. Iniciar Servidor de Desenvolvimento
```bash
npm run dev

# Esperado:
# VITE v5.0.0
# ➜  Local:   http://localhost:3000/
# ➜  press h + enter to show help
```

### 4. Testar no Navegador
```
Abrir: http://localhost:3000
Esperado: Página de login do Despesify
```

- [ ] Dependências instaladas
- [ ] Servidor rodando na porta 3000
- [ ] Página de login carrega
- [ ] CSS e icons carregando corretamente

## ✅ App Mobile Setup

### 1. Instalação
```bash
cd packages/mobile

# Instalar dependências
npm install

# Verificar se foi bem
npm list
```

### 2. Verificar Expo
```bash
# Instalar Expo CLI globalmente (opcional)
npm install -g expo-cli

# Ou usar npx
npx expo --version
```

### 3. Iniciar Expo
```bash
npm start

# Esperado:
# Expo DevTools
# ➜  To run the app with live reloading
# ➜  Press a (Android)
# ➜  Press i (iOS)
# ➜  Press w (Web)
# ➜  Or scan QR code
```

### 4. Opções de Teste
```bash
# Opção 1: Android Emulator
npm run android
# Certifique-se que Android Studio está instalado

# Opção 2: iOS Simulator (Mac only)
npm run ios
# Certifique-se que Xcode está instalado

# Opção 3: Web
npm run web

# Opção 4: Expo Go (recomendado para iniciar)
# Instale "Expo Go" no seu celular
# Escaneie QR code que aparecerá no terminal
```

- [ ] Dependências instaladas
- [ ] Expo funcional
- [ ] App roda no emulador/simulator/web

## ✅ Teste Funcional Completo

### 1. Registrar Usuário
```bash
# Frontend: http://localhost:3000
# 1. Clique em "Registre-se aqui"
# 2. Preencha:
#    - Nome: Test User
#    - Email: test@example.com
#    - Senha: password123
# 3. Clique em "Registrar"
```

- [ ] Registro bem-sucedido
- [ ] Redirecionado para dashboard
- [ ] Token salvo no localStorage

### 2. Adicionar Despesa
```bash
# No dashboard
# 1. Clique em "Despesas"
# 2. Clique em "+ Nova Despesa"
# 3. Preencha:
#    - Descrição: Almoço no restaurante
#    - Valor: 35.90
#    - Categoria: Alimentação
#    - Data: Hoje
# 4. Clique em "Adicionar Despesa"
```

- [ ] Despesa criada com sucesso
- [ ] Aparece na lista
- [ ] Valor aparece no dashboard

### 3. Ver Estatísticas
```bash
# 1. Clique em "Estatísticas"
# 2. Verifique se:
#    - Total gasto está correto
#    - Gráfico de categorias aparece
#    - Percentuais estão corretos
```

- [ ] Gráficos carregam
- [ ] Dados estão corretos
- [ ] Responsive no mobile

### 4. Editar/Deletar Despesa
```bash
# 1. Clique em "Despesas"
# 2. Clique em "Editar" em uma despesa
# 3. Altere os dados e salve
# 4. Clique em "Deletar" e confirme
```

- [ ] Edição funciona
- [ ] Exclusão funciona
- [ ] Dados atualizam em tempo real

## ✅ Deploy (Opcional)

### Backend (Heroku/Railway)
```bash
# 1. Criar conta em https://railway.app
# 2. Conectar GitHub
# 3. Deploy automático

# Ou manualmente:
cd packages/backend
railway link
railway up
```

- [ ] Backend em produção
- [ ] MONGODB_URI configurada
- [ ] JWT_SECRET configurada

### Frontend (Vercel/Netlify)
```bash
# 1. Criar conta em https://vercel.com
# 2. Importar projeto do GitHub
# 3. Deploy automático

# Ou manualmente:
cd packages/web
npm run build
vercel
```

- [ ] Build sem erros
- [ ] VITE_API_URL aponta para backend em produção
- [ ] Site em produção

### Mobile (EAS)
```bash
# 1. Criar conta em https://expo.dev
# 2. Configurar projeto
cd packages/mobile
eas build --platform all

# Ou build individual
eas build --platform android
eas build --platform ios
```

- [ ] Build para Android
- [ ] Build para iOS
- [ ] Apps disponíveis para download

## ✅ Troubleshooting

### Problema: MongoDB não conecta
```bash
# Solução 1: Verificar se está rodando
mongod --version
sudo systemctl status mongod

# Solução 2: Iniciar MongoDB
# macOS: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongod
# Windows: net start MongoDB

# Solução 3: Verificar URI em .env
# Padrão: mongodb://localhost:27017/despesify
```

### Problema: Porta 3000/3001 já em uso
```bash
# Encontrar processo usando a porta
lsof -i :3000
# ou
netstat -tulpn | grep :3000

# Matar processo
kill -9 PID
# ou trocar porta em vite.config.js ou .env
```

### Problema: CORS error
```bash
# Verificar se backend está rodando
curl http://localhost:3001/health

# Se não, iniciar backend primeiro
cd packages/backend && npm run dev
```

### Problema: Módulos não encontrados
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problema: Expo não abre
```bash
# Verificar versão do Node
node --version # deve ser 16+

# Atualizar Expo
npm install -g expo-cli@latest
# ou usar npx (não precisa instalar)
npx expo@latest start
```

## ✅ Desenvolvimento Contínuo

### Estrutura de Branches
```bash
main                # Produção
  └─ develop        # Desenvolvimento
      ├─ feature/*  # Novas features
      ├─ bugfix/*   # Correções
      └─ hotfix/*   # Fixes urgentes
```

### Git Workflow
```bash
# Criar branch para feature
git checkout develop
git pull origin develop
git checkout -b feature/seu-feature

# Desenvolver, commitar, push
git add .
git commit -m "feat: descrição"
git push origin feature/seu-feature

# Criar Pull Request no GitHub
# Review e merge para develop

# Quando pronto para produção
# Merge develop para main
```

### Testes
```bash
# Backend (quando implementado)
cd packages/backend && npm test

# Web (quando implementado)
cd packages/web && npm test

# Mobile (quando implementado)
cd packages/mobile && npm test
```

- [ ] Workflow de Git configurado
- [ ] Testes rodando
- [ ] CI/CD configurado (GitHub Actions, etc)

## ✅ Checklist Final

- [ ] Projeto clonado/preparado
- [ ] Backend rodando (3001)
- [ ] Frontend web rodando (3000)
- [ ] App mobile rodando (Expo)
- [ ] MongoDB conectado
- [ ] Registro/Login funciona
- [ ] CRUD de despesas funciona
- [ ] Estatísticas carregam
- [ ] Documentação lida
- [ ] Git configurado
- [ ] Pronto para desenvolvimento!

---

## 📚 Próximos Passos

1. Ler `QUICKSTART.md` para commands básicos
2. Ler `ARCHITECTURE.md` para entender estrutura
3. Ler `ROADMAP.md` para ver futuras features
4. Abrir issues/PRs para novas features
5. Deploy em staging antes de produção

## 🎉 Tudo Pronto!

Seu ambiente de desenvolvimento está configurado e pronto para começar!

```
Happy Coding! 🚀
```

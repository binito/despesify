# Guia de Início Rápido - Despesify

## 🚀 Começar em 5 minutos

### Passo 1: Instalar Dependências

```bash
# Na raiz do projeto
npm install
```

### Passo 2: Configurar o Backend

```bash
cd packages/backend

# Criar arquivo .env
cp .env.example .env

# Instalar dependências
npm install

# Iniciar MongoDB (certifique-se que está rodando)
# No Linux/Mac: mongod
# No Windows: "C:\Program Files\MongoDB\Server\{version}\bin\mongod.exe"

# Iniciar servidor
npm run dev
```

O backend estará disponível em `http://localhost:3001`

### Passo 3: Iniciar o Frontend Web

```bash
cd packages/web

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O site estará disponível em `http://localhost:3000`

### Passo 4: Iniciar o App Mobile

```bash
cd packages/mobile

# Instalar dependências
npm install

# Iniciar Expo
npm start

# No terminal que aparecer:
# - Pressione 'a' para Android
# - Pressione 'i' para iOS
# - Pressione 'w' para Web
# - Ou escaneie o QR code com o Expo Go no seu celular
```

## 📝 Criar Conta e Testar

1. Acesse `http://localhost:3000`
2. Clique em "Registre-se aqui"
3. Preencha os dados:
   - Nome: Seu Nome
   - Email: teste@exemplo.com
   - Senha: senha123

4. Clique em "Registrar"
5. Você será redirecionado ao dashboard

## 🧪 Adicionar Despesas

1. Clique em "Despesas" no menu lateral
2. Clique em "+ Nova Despesa"
3. Preencha os dados:
   - Descrição: Ex. "Almoço no restaurante"
   - Valor: Ex. 35.90
   - Categoria: Alimentação
   - Data: Data da despesa
   - Método de Pagamento: Cartão de Crédito
4. Clique em "Adicionar Despesa"

## 📊 Visualizar Estatísticas

1. Clique em "Estatísticas" no menu lateral
2. Veja os gráficos e relatórios das suas despesas

## 🔧 Troubleshooting

### MongoDB não conecta
- Certifique-se que MongoDB está instalado e rodando
- Verifique se a URI no .env está correta
- Tente conectar via `mongo` no terminal

### Porta 3000 ou 3001 já em uso
- Mude a porta no `vite.config.js` para o web
- Mude no `.env` para o backend

### CORS error
- Verifique se o backend está rodando em `http://localhost:3001`
- Verifique se o CORS está habilitado no `src/index.js` do backend

## 📱 Desenvolvendo para Mobile

Para desenvolvimento em Android/iOS:
1. Instale o Expo Go no seu celular
2. Execute `npm start` na pasta mobile
3. Escaneie o QR code

## 🚀 Deploy

### Backend (Heroku/Railway)
```bash
cd packages/backend
# Configure a variável MONGODB_URI para seu banco remoto
git push heroku main
```

### Frontend (Vercel/Netlify)
```bash
cd packages/web
npm run build
# Deploy a pasta dist para Vercel ou Netlify
```

### Mobile (App Store/Google Play)
```bash
cd packages/mobile
eas build --platform all
```

## 📚 Próximos Passos

- Implementar upload de recibos
- Adicionar compartilhamento de despesas
- Implementar exportação em PDF
- Adicionar suporte offline
- Implementar notificações push

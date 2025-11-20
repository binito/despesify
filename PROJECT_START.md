# Despesify v2.0 - Projeto Iniciado

## Status Atual

✅ **Projeto completamente reconstruído do zero**

O repositório foi totalmente limpo e reconstruído com uma arquitetura moderna e profissional.

## O Que Foi Implementado

### 1. Arquitetura Next.js Full-Stack
- Framework React 18 com TypeScript
- API Routes integradas
- SSR e otimizações de performance
- Tailwind CSS para estilização

### 2. Autenticação Segura
- Registro de utilizadores com validação
- Login com JWT de longa duração (30 dias)
- Hash de senhas com bcrypt
- Middleware de autenticação para rotas protegidas

### 3. Gestão de Despesas
- Criar despesas com múltiplos campos
- Upload de ficheiros (imagens e PDFs)
- Categorias personalizadas por utilizador
- Tracking de IVA e métodos de pagamento
- Listagem com filtros (todas/este mês)

### 4. OCR Automático
- Tesseract.js para reconhecimento de texto
- Detecção automática de valores monetários
- Extração de datas
- Identificação de IVA
- Preenchimento automático de campos do formulário

### 5. Banco de Dados MariaDB
- 4 tabelas: users, categories, expenses, invoice_attachments
- Índices otimizados
- Relacionamentos com integridade referencial
- Script de inicialização automática

### 6. Sincronização com Streamlit
- Exportação automática para CSV
- Ficheiros em `data/expenses.csv`
- Compatível com aplicação Streamlit porta 8502
- Atualização em tempo real

### 7. Documentação Completa
- `README.md` - Visão geral
- `SETUP.md` - Configuração detalhada
- `DEPLOYMENT.md` - Deploy em produção
- `.env.local.example` - Variáveis de ambiente

## Próximos Passos

### Antes de Começar a Usar

1. **Instalar Dependências**
   ```bash
   npm install
   ```

2. **Configurar Banco de Dados**
   ```bash
   # Editar .env.local com suas credenciais MariaDB
   cp .env.local.example .env.local

   # Inicializar banco
   node scripts/init-db.js
   ```

3. **Iniciar em Desenvolvimento**
   ```bash
   npm run dev
   # Acesso em http://localhost:8520
   ```

4. **Testar Fluxo Completo**
   - Registar novo utilizador
   - Fazer login
   - Criar despesa
   - Fazer upload de ficheiro com OCR
   - Verificar CSV gerado em `data/`

### Para Produção (192.168.1.176:8520)

```bash
npm run build
npm run start
```

### Para Domínio (despesify.cafemartins.pt)

Ver `DEPLOYMENT.md` para:
- Configuração Nginx
- Certificado SSL
- PM2 para serviço permanente
- Integração com Streamlit

## Estrutura de Ficheiros

```
/home/jorge/despesify/
├── README.md                # Documentação principal
├── SETUP.md                # Guia de configuração
├── DEPLOYMENT.md           # Guia de deploy
├── PROJECT_START.md        # Este ficheiro
│
├── package.json            # Dependências
├── tsconfig.json           # Configuração TypeScript
├── next.config.js          # Configuração Next.js
├── tailwind.config.js      # Tailwind CSS
├── postcss.config.js       # PostCSS
│
├── .env.local              # Variáveis (não commitado)
├── .env.local.example      # Template de variáveis
├── .gitignore              # Git ignore
│
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página inicial
│   ├── globals.css         # Estilos globais
│   │
│   ├── api/
│   │   ├── auth/           # Autenticação
│   │   ├── despesas/       # Gestão despesas
│   │   ├── ocr/            # OCR
│   │   ├── categorias/     # Categorias
│   │   └── sync-csv/       # Sincronização
│   │
│   ├── login/              # Página login
│   ├── registro/           # Página registro
│   └── despesas/           # Páginas despesas
│
├── lib/
│   ├── db.ts              # Conexão MariaDB
│   ├── auth.ts            # Funções auth
│   └── authMiddleware.ts  # Middleware
│
├── public/
│   └── uploads/           # Ficheiros (gitignore)
│
├── data/
│   └── expenses.csv       # CSV Streamlit (gitignore)
│
└── scripts/
    └── init-db.js         # Inicializar BD
```

## Variáveis de Ambiente Necessárias

```env
# Acesso à aplicação
NEXT_PUBLIC_API_URL=http://localhost:8520

# Banco de dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=despesify
DB_PORT=3306

# Autenticação
JWT_SECRET=sua_chave_secreta_aqui

# Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760

# OCR
TESSERACT_LANG=por+eng

# Streamlit
STREAMLIT_CSV_PATH=./data/expenses.csv
```

## Funcionalidades Prontas para Uso

### Frontend
- ✅ Página inicial com dashboard
- ✅ Formulário de registro
- ✅ Formulário de login
- ✅ Página de nova despesa com upload
- ✅ Listagem de despesas com filtros
- ✅ UI responsiva com Tailwind

### Backend
- ✅ Autenticação JWT
- ✅ CRUD de despesas
- ✅ CRUD de categorias
- ✅ Upload de ficheiros
- ✅ Processamento OCR
- ✅ Geração CSV para Streamlit
- ✅ Validação de inputs

## Funcionalidades Futuras

Podem ser adicionadas:
- [ ] Dashboard com gráficos
- [ ] Exportação em PDF
- [ ] Relatórios mensais/anuais
- [ ] Integração de receitas
- [ ] Múltiplas contas
- [ ] Configurações de utilizador
- [ ] 2FA para login
- [ ] Tema escuro
- [ ] Aplicação mobile
- [ ] Compartilhamento de despesas

## Suporte Técnico

### Documentos Importantes
- `SETUP.md` - Problemas de configuração
- `DEPLOYMENT.md` - Problemas de deploy
- Logs do PM2 - Erros em produção

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm run start

# Inicializar BD
node scripts/init-db.js

# PM2 (se instalado)
pm2 start npm -- start --name "despesify"
pm2 logs despesify
pm2 restart despesify
```

## Requisitos Mínimos

- Node.js 18+
- MariaDB 10.6+
- npm 9+
- 200MB de espaço em disco

## Notas Importantes

1. **Primeira Execução**: Executar `node scripts/init-db.js` para criar tabelas
2. **Variáveis de Ambiente**: MUDE `JWT_SECRET` em produção
3. **Segurança**: Configure HTTPS em produção
4. **Backups**: Realize backups regularmente do MariaDB
5. **Logs**: Monitore logs para erros em produção

---

## Resumo da Implementação

Este projeto foi totalmente reconstruído com:

✨ **Tecnologia Moderna**: Next.js 14, TypeScript, Tailwind CSS
🔐 **Segurança**: JWT, bcrypt, validação de inputs
📊 **Dados**: MariaDB com relacionamentos
🖼️ **OCR**: Tesseract.js automático
🔄 **Integração**: CSV para Streamlit
📱 **Responsivo**: UI moderna e funcional
📚 **Documentado**: Guias completos para setup e deploy

**Status**: Pronto para desenvolvimento e produção

---

Última atualização: 19 de Novembro de 2025

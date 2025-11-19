# Despesify v2.0

Aplicação web de gestão de despesas pessoais com OCR, sincronização com Streamlit e interface moderna.

## ✨ Funcionalidades

✅ **Autenticação Multi-user**
- Registro seguro com hash de senhas
- Login com JWT
- Sessões persistentes

✅ **Gestão de Despesas**
- Criar, listar e visualizar despesas
- Categorias personalizadas por utilizador
- Métodos de pagamento variados
- Suporte a IVA

✅ **Upload de Ficheiros**
- Imagens (JPG, PNG)
- PDFs de facturas
- Armazenamento seguro

✅ **OCR Automático e Manual**
- Tesseract.js para extração de texto
- Detecção de valores monetários
- Extração automática de datas
- Identificação de IVA
- Preenchimento automático de campos
- Botão OCR manual para processar qualquer imagem/PDF sob demanda
- Feedback visual com campos extraídos

✅ **Sincronização Streamlit**
- Exportação automática para CSV
- Compatível com Streamlit (porta 8502)
- Atualizações em tempo real

## 🚀 Quick Start

### 1. Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

Copie e edite `.env.local`:

```bash
cp .env.local.example .env.local
```

Inicialize o MariaDB:

```bash
node scripts/init-db.js
```

### 3. Iniciar Servidor

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
npm run start
```

Acesso em `http://localhost:8520`

## 📋 Requisitos

- Node.js >= 18.0.0
- MariaDB >= 10.6
- npm ou yarn

## 📁 Estrutura

```
app/
├── api/                        # Rotas API
│   ├── auth/                  # Login/Registro
│   ├── despesas/              # Gestão de despesas
│   ├── ocr/                   # OCR de facturas
│   ├── categorias/            # Gestão de categorias
│   └── sync-csv/              # Sincronização Streamlit
├── login/                      # Página de login
├── registro/                   # Página de registro
└── despesas/                   # Gestão de despesas

lib/
├── db.ts                       # Conexão MariaDB
├── auth.ts                     # Funções de autenticação
└── authMiddleware.ts           # Middleware JWT
```

## 📸 Como usar OCR

### OCR Automático
Ao fazer upload de uma imagem, o OCR é executado automaticamente e preenche os campos.

### OCR Manual
Para processar uma imagem manualmente ou reprocessar uma fatura:
1. Vá para **Nova Despesa**
2. Faça upload da imagem/PDF
3. Clique no botão **🔍 OCR** sobreposto na preview
4. O sistema extrai: Valor, Descrição, Data e IVA
5. Reveja e ajuste os valores conforme necessário

## 🔐 Autenticação

Token JWT obrigatório para endpoints protegidos:

```
Authorization: Bearer {token}
```

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/registro` - Registrar novo utilizador
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do utilizador

### Despesas
- `GET /api/despesas` - Listar despesas
- `POST /api/despesas` - Criar despesa com upload

### OCR
- `POST /api/ocr` - Processar fatura com OCR

### Categorias
- `GET /api/categorias` - Listar categorias
- `POST /api/categorias` - Criar categoria

### Sincronização
- `POST /api/sync-csv` - Sincronizar com CSV para Streamlit

## 🌐 Deploy

### Localmente (192.168.1.176:8520)

```bash
npm run build
npm run start
```

### Domínio (despesify.cafemartins.pt)

Configurar Nginx como proxy reverso com SSL.

Ver `SETUP.md` para instruções completas.

## 📚 Documentação

- `SETUP.md` - Guia de configuração detalhado
- `.env.local.example` - Variáveis de ambiente

## 🛠️ Tecnologias

- **Next.js 14** - Framework React fullstack
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **MariaDB** - Banco de dados
- **JWT** - Autenticação
- **Tesseract.js** - OCR
- **mysql2** - Driver MySQL

## ⚡ Performance

- Server-side rendering
- Otimização de imagens
- Caching
- Compressão Gzip

## 🔒 Segurança

✓ Hashing de senhas com bcrypt
✓ JWT para autenticação
✓ Validação de inputs
✓ Proteção contra CSRF
✓ Suporte a HTTPS (produção)

## 📝 Próximos Passos

- [ ] Dashboard com gráficos
- [ ] Exportação em PDF
- [ ] Relatórios mensais
- [ ] Integração de receitas
- [ ] 2FA para login
- [ ] Tema escuro

## 📄 Licença

MIT

---

Para mais informações, consulte `SETUP.md`

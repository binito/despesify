# Despesify v2 - Guia de Configuração

## Requisitos

- Node.js >= 18.0.0
- MariaDB >= 10.6
- npm ou yarn
- Python 3.8+ (para leitor de QR de faturas AT)
- OpenCV e pyzbar (para leitura de códigos QR)

## Instalação

### 1. Dependências Node.js

```bash
npm install
```

### 1.1. Dependências Python (para leitor QR)

Instale as dependências do sistema (Linux/Raspberry Pi):

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-opencv libzbar0

# Instalar dependências Python
pip3 install -r requirements.txt --break-system-packages
```

No macOS:

```bash
# Instalar zbar via Homebrew
brew install zbar

# Instalar dependências Python
pip3 install -r requirements.txt
```

No Windows:

```bash
pip install -r requirements.txt
```

### 2. Variáveis de Ambiente

Copie e ajuste o ficheiro `.env.local`:

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com as suas credenciais:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=despesify
DB_PORT=3306

# JWT
JWT_SECRET=mude_para_uma_chave_segura_em_producao

# Streamlit
STREAMLIT_CSV_PATH=./data/expenses.csv
```

### 3. Inicializar Base de Dados

```bash
node scripts/init-db.js
```

Isto irá criar:
- Banco de dados `despesify`
- Tabelas necessárias (users, categories, expenses, invoice_attachments)

## Execução

### Desenvolvimento

```bash
npm run dev
```

Acesso em `http://localhost:8520`

### Build para Produção

```bash
npm run build
npm run start
```

## Estrutura do Projeto

```
despesify/
├── app/                      # Código Next.js (App Router)
│   ├── api/                 # Rotas API
│   │   ├── auth/           # Autenticação
│   │   ├── despesas/       # Gestão de despesas
│   │   ├── ocr/            # OCR de facturas
│   │   ├── categorias/     # Gestão de categorias
│   │   └── sync-csv/       # Sincronização com Streamlit
│   ├── login/              # Página de login
│   ├── registro/           # Página de registro
│   ├── despesas/           # Páginas de despesas
│   └── globals.css         # Estilos globais
├── lib/
│   ├── db.ts              # Conexão com banco de dados
│   ├── auth.ts            # Funções de autenticação
│   └── authMiddleware.ts  # Middleware para proteger rotas
├── public/
│   └── uploads/           # Ficheiros carregados (ignorado em git)
├── data/                  # CSVs para Streamlit (ignorado em git)
├── scripts/
│   └── init-db.js        # Script de inicialização
└── package.json
```

## Funcionalidades Implementadas

✅ **Autenticação Multi-user**
- Registro de novos utilizadores
- Login seguro com JWT
- Verificação de autenticação

✅ **Gestão de Despesas**
- Criar, listar e visualizar despesas
- Categorias personalizadas
- Métodos de pagamento

✅ **Upload de Ficheiros**
- Suporta imagens (JPG, PNG)
- Suporta PDFs
- Armazenamento em `public/uploads/`

✅ **OCR Automático**
- Tesseract.js para extração de texto
- Detecção de valores monetários
- Extração de datas
- Detecção de IVA

✅ **Leitor de Código QR de Faturas AT (Português)**
- Leitura automática de QR codes de faturas emitidas em Portugal
- Extração de dados estruturados:
  - NIF do emitente e adquirente
  - Data e número do documento
  - Código ATCUD
  - Valores: base tributável, IVA total, taxa de IVA
  - Hash de validação
- Pré-preenchimento automático de campos
- Suporta as três taxas de IVA portuguesas (6%, 13%, 23%)

✅ **Sincronização CSV**
- Exportação automática para CSV
- Compatível com Streamlit
- Ficheiros em `data/`

## Leitor de Código QR de Faturas AT

O sistema suporta leitura automática de códigos QR em faturas portuguesas (emitidas pela Autoridade Tributária).

### Como usar:

1. **Na página de Nova Despesa**, upload uma imagem de fatura com código QR
2. Clique no botão **📱 QR** no preview da imagem
3. Os dados serão automaticamente extraídos e preenchidos:
   - Valor total
   - Data da fatura
   - Número do documento
   - NIF do emitente/adquirente
   - Taxa de IVA
   - ATCUD
   - Base tributável

### Dados extraídos do QR:

```json
{
  "nif_emitente": "123456789",
  "nif_adquirente": "987654321",
  "pais_adquirente": "PT",
  "tipo_documento": "FT",
  "data_emissao": "2024-11-20",
  "numero_documento": "FT 2024/123",
  "atcud": "ATCUD123-456",
  "base_tributavel": 100.0,
  "valor_iva": 23.0,
  "taxa_iva_codigo": "NOR",
  "taxa_iva_percentagem": 23,
  "valor_total": 123.0,
  "hash": "ABC123..."
}
```

## Integração com Streamlit

Os ficheiros CSV são gerados automaticamente em `data/expenses.csv`.

Seu Streamlit pode ler directamente:

```python
import pandas as pd

df = pd.read_csv('data/expenses.csv')
print(df)
```

## Deploy

### Localmente (192.168.1.176:8520)

```bash
npm run build
npm run start
```

### Domínio (despesify.cafemartins.pt)

Será necessário:
1. Servidor web (Nginx/Apache)
2. Certificado SSL
3. Proxy reverso para localhost:8520
4. DNS apontando para seu servidor

**Exemplo de configuração Nginx:**

```nginx
server {
    listen 443 ssl http2;
    server_name despesify.cafemartins.pt;

    ssl_certificate /etc/letsencrypt/live/despesify.cafemartins.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/despesify.cafemartins.pt/privkey.pem;

    location / {
        proxy_pass http://localhost:8520;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Segurança

⚠️ **Importante para Produção:**

1. Mude `JWT_SECRET` para algo seguro
2. Use HTTPS obrigatoriamente
3. Configure CORS adequadamente
4. Use variáveis de ambiente para senhas
5. Implemente rate limiting para APIs
6. Considere adicionar 2FA para login

## Troubleshooting

### Erro de conexão com MariaDB

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

Verifique se MariaDB está a correr:

```bash
sudo systemctl status mariadb
sudo systemctl start mariadb
```

### Tesseract não funciona

Se tesseract.js não reconhecer idiomas, execute:

```bash
npm install --save tesseract.js
```

### Ficheiros não são salvos

Verifique permissões:

```bash
mkdir -p public/uploads data
chmod 755 public/uploads data
```

## Próximos Passos

- [ ] Dashboard com gráficos de gastos
- [ ] Exportação em PDF
- [ ] Relatórios mensais
- [ ] Integração de receitas
- [ ] Múltiplas contas
- [ ] Configurações de utilizador

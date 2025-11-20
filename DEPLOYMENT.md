# Guia de Deployment - Despesify v2.0

## 1. Acesso Local (192.168.1.176:8520)

### Configuração Simples

```bash
# 1. Clonar/atualizar código
cd /home/jorge/despesify
git pull origin master

# 2. Instalar dependências
npm install

# 3. Construir aplicação
npm run build

# 4. Iniciar servidor
npm run start
```

O aplicativo estará acessível em `http://192.168.1.176:8520`

### Rodando como Serviço (PM2)

Para manter a aplicação rodando permanentemente:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start npm -- start --name "despesify"

# Fazer iniciar com o sistema
pm2 startup
pm2 save

# Verificar status
pm2 status
```

## 2. Acesso via Domínio (despesify.cafemartins.pt)

### Pré-requisitos

1. Domínio apontando para seu servidor (via DNS)
2. Certificado SSL (Let's Encrypt recomendado)
3. Nginx instalado

### Instalação e Configuração

#### 1. Certificado SSL

```bash
# Instalar Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obter certificado
sudo certbot certonly --standalone -d despesify.cafemartins.pt
```

#### 2. Configuração Nginx

Criar ficheiro `/etc/nginx/sites-available/despesify`:

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name despesify.cafemartins.pt;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name despesify.cafemartins.pt;

    # Certificado SSL
    ssl_certificate /etc/letsencrypt/live/despesify.cafemartins.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/despesify.cafemartins.pt/privkey.pem;

    # Configurações SSL de segurança
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss;

    # Proxy para Next.js
    location / {
        proxy_pass http://localhost:8520;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Dados de upload
    location /uploads {
        alias /home/jorge/despesify/public/uploads;
    }

    # CSV para Streamlit
    location /data {
        alias /home/jorge/despesify/data;
    }
}
```

#### 3. Ativar Nginx

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/despesify /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Habilitar no startup
sudo systemctl enable nginx
```

## 3. Integração com Streamlit

Seu Streamlit na porta 8502 pode ler os CSVs gerados automaticamente:

```python
import pandas as pd
import streamlit as st
from pathlib import Path

# Ficheiro de dados do Despesify
csv_path = Path('/home/jorge/despesify/data/expenses.csv')

if csv_path.exists():
    df = pd.read_csv(csv_path)

    st.title('Dashboard de Despesas')
    st.dataframe(df)

    # Gráficos
    if not df.empty:
        st.bar_chart(df.groupby('Categoria')['Valor'].sum())
else:
    st.warning('Dados não disponíveis ainda')
```

## 4. Monitoramento e Manutenção

### Verificar Logs

```bash
# PM2
pm2 logs despesify

# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Renovação de Certificado SSL

```bash
# Renovação automática já está configurada com Certbot
# Verificar status
sudo certbot renew --dry-run
```

### Backups

```bash
# Backup do MariaDB
mysqldump -u root -p despesify > backup_despesify_$(date +%Y%m%d).sql

# Backup dos ficheiros
tar -czf despesify_files_$(date +%Y%m%d).tar.gz /home/jorge/despesify
```

## 5. Troubleshooting

### Erro: "502 Bad Gateway"

```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar logs
pm2 logs despesify
```

### Erro: "Connection refused"

```bash
# Verificar porta 8520
lsof -i :8520

# Reiniciar aplicação
pm2 restart despesify
```

### Certificado expirado

```bash
# Renovar certificado
sudo certbot renew

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 6. Variáveis de Produção

Editar `.env.local` para produção:

```env
NEXT_PUBLIC_API_URL=https://despesify.cafemartins.pt

# Database
DB_HOST=localhost
DB_USER=despesify_user
DB_PASSWORD=senha_segura_aqui
DB_NAME=despesify
DB_PORT=3306

# JWT
JWT_SECRET=MUDE_PARA_CHAVE_MUITO_SEGURA_AQUI

# Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=10485760

# OCR
TESSERACT_LANG=por+eng

# Streamlit Integration
STREAMLIT_CSV_PATH=./data/expenses.csv

# Production
NODE_ENV=production
```

## 7. Performance

### Otimizações Recomendadas

1. **Cache do Nginx**
   - Ficheiros estáticos: 1 ano
   - HTML: sem cache

2. **Compressão Gzip**
   - Já configurada no Nginx

3. **CDN** (opcional)
   - Usar para imagens estáticas
   - Cloudflare recomendado

4. **Database**
   - Criar índices nas colunas frequentemente consultadas
   - Realizar backups regularmente

## 8. Segurança

✓ SSL/TLS obrigatório
✓ Headers de segurança configurados
✓ Rate limiting no Nginx (recomendado)
✓ Firewall configurado (UFW)
✓ SSH key-based authentication

### Configurar Firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3306/tcp    # Se MariaDB remoto
```

---

Para suporte adicional, consulte `SETUP.md`

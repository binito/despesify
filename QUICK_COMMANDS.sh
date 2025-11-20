#!/bin/bash

# ============================================================================
# DESPESIFY v2.0 - COMANDOS RÁPIDOS
# ============================================================================

echo "🚀 DESPESIFY v2.0 - Comandos Rápidos"
echo "===================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Menu
echo -e "${BLUE}Selecione uma opção:${NC}"
echo ""
echo "1) Instalar dependências"
echo "2) Configurar banco de dados"
echo "3) Iniciar em desenvolvimento"
echo "4) Build para produção"
echo "5) Iniciar servidor produção"
echo "6) Iniciar com PM2 (serviço permanente)"
echo "7) Ver logs (desenvolvimento)"
echo "8) Ver logs (PM2)"
echo "9) Criar variáveis de ambiente"
echo "0) Sair"
echo ""

read -p "Opção: " option

case $option in
  1)
    echo -e "${YELLOW}Instalando dependências...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependências instaladas${NC}"
    ;;

  2)
    echo -e "${YELLOW}Configurando banco de dados...${NC}"
    if [ ! -f .env.local ]; then
      echo "Criando .env.local..."
      cp .env.local.example .env.local
      echo -e "${YELLOW}⚠️  Edite .env.local com suas credenciais MariaDB${NC}"
    fi
    echo "Inicializando banco..."
    node scripts/init-db.js
    echo -e "${GREEN}✓ Banco de dados configurado${NC}"
    ;;

  3)
    echo -e "${YELLOW}Iniciando servidor de desenvolvimento...${NC}"
    npm run dev
    ;;

  4)
    echo -e "${YELLOW}Fazendo build...${NC}"
    npm run build
    echo -e "${GREEN}✓ Build concluído${NC}"
    ;;

  5)
    echo -e "${YELLOW}Iniciando servidor de produção...${NC}"
    npm run build && npm run start
    ;;

  6)
    echo -e "${YELLOW}Iniciando com PM2...${NC}"
    if ! command -v pm2 &> /dev/null; then
      echo "PM2 não instalado. Instalando..."
      npm install -g pm2
    fi
    npm run build
    pm2 start npm -- start --name "despesify"
    pm2 startup
    pm2 save
    echo -e "${GREEN}✓ PM2 iniciado${NC}"
    echo -e "${GREEN}✓ Será iniciado automaticamente com o sistema${NC}"
    pm2 status
    ;;

  7)
    echo -e "${YELLOW}Logs de desenvolvimento:${NC}"
    npm run dev
    ;;

  8)
    echo -e "${YELLOW}Logs do PM2:${NC}"
    pm2 logs despesify
    ;;

  9)
    echo -e "${YELLOW}Criando .env.local...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}✓ Ficheiro .env.local criado${NC}"
    echo -e "${YELLOW}Edite com suas credenciais:${NC}"
    echo "  DB_HOST=localhost"
    echo "  DB_USER=root"
    echo "  DB_PASSWORD=sua_senha"
    echo "  JWT_SECRET=chave_segura"
    ;;

  0)
    echo "Saindo..."
    exit 0
    ;;

  *)
    echo -e "${YELLOW}Opção inválida${NC}"
    ;;
esac

echo ""
echo -e "${GREEN}Feito!${NC}"

# Como Gerar APK para Despesify

## Opção 1: PWA - Instalação Direta (Recomendado)

A forma mais simples é instalar como PWA diretamente no telemóvel:

1. Abra https://despesify.cafemartins.pt/ no Chrome/Edge do Android
2. Toque no menu (⋮) e selecione "Adicionar ao ecrã inicial" ou "Instalar aplicação"
3. A aplicação será instalada como app nativa!

### Vantagens:
- ✅ Sem necessidade de APK
- ✅ Atualizações automáticas
- ✅ Acesso à câmara para QR scanner
- ✅ Funciona offline (service worker)
- ✅ Ícone no launcher
- ✅ Sem barra de navegador

## Opção 2: Gerar APK com Bubblewrap

Se precisar de um APK verdadeiro:

### Pré-requisitos:
```bash
# Instalar JDK 17
sudo apt install openjdk-17-jdk

# Instalar Android SDK
# Download: https://developer.android.com/studio#command-tools

# Instalar Bubblewrap CLI (já instalado)
npm install -g @bubblewrap/cli
```

### Passos para gerar APK:

```bash
cd /home/jorge/despesify/android-apk

# Inicializar projeto (interativo)
bubblewrap init --manifest=https://despesify.cafemartins.pt/manifest.json

# Responder às perguntas:
# - JDK: Yes (deixar bubblewrap instalar)
# - Package name: pt.cafemartins.despesify
# - Application name: Despesify
# - Launcher name: Despesify
# - Status bar color: #3B82F6
# - Navigation bar color: #3B82F6
# - Icon URL: https://despesify.cafemartins.pt/icon-512.png
# - Maskable icon: https://despesify.cafemartins.pt/icon-512.png
# - Fallback strategy: customtabs
# - Notification delegation: true
# - Location delegation: false
# - Signing key: Generate new key

# Construir APK
bubblewrap build

# O APK estará em: app/build/outputs/apk/release/app-release-signed.apk
```

## Opção 3: Usar PWA Builder

Alternativa online sem instalar ferramentas:

1. Acesse https://www.pwabuilder.com/
2. Cole a URL: https://despesify.cafemartins.pt/
3. Clique em "Generate"
4. Escolha "Android" e "Generate Package"
5. Baixe o APK gerado

## Opção 4: Usar Android Studio (Manual)

Para controle total:

1. Abrir Android Studio
2. New Project → Empty Activity
3. Configurar Trusted Web Activity:
   - Adicionar dependência: `implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'`
   - Configurar activity para abrir https://despesify.cafemartins.pt/
   - Adicionar Digital Asset Links
4. Build → Generate Signed Bundle/APK

## Verificar PWA

Para garantir que o PWA está configurado corretamente:

```bash
# Lighthouse audit
npx lighthouse https://despesify.cafemartins.pt/ --view

# Verificar manifest
curl https://despesify.cafemartins.pt/manifest.json

# Verificar service worker
# Abrir DevTools → Application → Service Workers
```

## Troubleshooting

### PWA não aparece opção "Instalar"
- Verifique se está usando HTTPS
- Certifique-se que o manifest.json está acessível
- Verifique se o service worker está registado
- Teste no Chrome/Edge (Safari iOS tem suporte limitado)

### APK não instala
- Ative "Fontes desconhecidas" nas definições do Android
- Verifique se o APK está assinado corretamente
- Tente instalar via `adb install app-release-signed.apk`

## Status Atual

✅ Manifest.json configurado com URL produção
✅ Ícones PWA criados (72px até 512px)
✅ Service Worker básico criado
✅ Shortcuts configurados (Nova Despesa)
🔄 APK: Use método PWA Builder ou Bubblewrap acima

## Links Úteis

- PWA Builder: https://www.pwabuilder.com/
- Bubblewrap CLI: https://github.com/GoogleChromeLabs/bubblewrap
- TWA Guide: https://developer.chrome.com/docs/android/trusted-web-activity/
- Digital Asset Links: https://developers.google.com/digital-asset-links/v1/getting-started

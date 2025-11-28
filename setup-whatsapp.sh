#!/bin/bash

# Script de configuração rápida da Evolution API
# Uso: ./setup-whatsapp.sh YOUR_API_KEY

API_KEY=$1
BASE_URL="http://localhost:8080"
INSTANCE_NAME="zaptfood"
N8N_WEBHOOK="http://host.docker.internal:5678/webhook/whatsapp"

if [ -z "$API_KEY" ]; then
    echo "❌ Erro: API Key não fornecida"
    echo "Uso: ./setup-whatsapp.sh YOUR_API_KEY"
    exit 1
fi

echo "🚀 Iniciando configuração da Evolution API..."
echo ""

# 1. Criar instância
echo "📱 Criando instância '$INSTANCE_NAME'..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/instance/create" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"instanceName\": \"$INSTANCE_NAME\",
    \"qrcode\": true
  }")

echo "$CREATE_RESPONSE" | jq '.'
echo ""

# 2. Obter QR Code
echo "📸 Obtendo QR Code..."
sleep 2
QR_RESPONSE=$(curl -s -X GET "$BASE_URL/instance/connect/$INSTANCE_NAME" \
  -H "apikey: $API_KEY")

QR_BASE64=$(echo "$QR_RESPONSE" | jq -r '.base64')

if [ "$QR_BASE64" != "null" ] && [ -n "$QR_BASE64" ]; then
    echo "✅ QR Code obtido com sucesso!"
    echo "🔗 Acesse este link para visualizar: $BASE_URL/instance/qrcode/$INSTANCE_NAME"
    echo ""
    echo "📱 Escaneie o QR Code no WhatsApp:"
    echo "   1. Abra WhatsApp > Configurações > Aparelhos conectados"
    echo "   2. Clique em 'Conectar um aparelho'"
    echo "   3. Escaneie o QR Code"
else
    echo "⚠️  Não foi possível obter o QR Code. Resposta:"
    echo "$QR_RESPONSE" | jq '.'
fi

echo ""
echo "⏳ Aguardando conexão do WhatsApp (pressione Ctrl+C após escanear)..."
sleep 30

# 3. Configurar Webhook
echo ""
echo "🔗 Configurando webhook para n8n..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/webhook/set/$INSTANCE_NAME" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$N8N_WEBHOOK\",
    \"webhook_by_events\": false,
    \"webhook_base64\": false,
    \"events\": [\"MESSAGES_UPSERT\"]
  }")

echo "$WEBHOOK_RESPONSE" | jq '.'
echo ""

# 4. Verificar status
echo "✅ Verificando status da instância..."
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/instance/connectionState/$INSTANCE_NAME" \
  -H "apikey: $API_KEY")

echo "$STATUS_RESPONSE" | jq '.'
echo ""

echo "🎉 Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Importe os workflows no n8n (http://localhost:5678)"
echo "   2. Configure as variáveis no n8n:"
echo "      - EVOLUTION_API_URL: http://evolution_api:8080"
echo "      - EVOLUTION_API_KEY: $API_KEY"
echo "      - EVOLUTION_INSTANCE: $INSTANCE_NAME"
echo "   3. Teste enviando 'Oi' para o WhatsApp"

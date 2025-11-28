# Guia de Configuração - Evolution API + WhatsApp

## 1. Configurar Instância no Evolution API

### 1.1 Criar Nova Instância
```bash
# Substitua YOUR_API_KEY pela sua chave (definida no .env como EVOLUTION_API_KEY)
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "zaptfood",
    "qrcode": true
  }'
```

**Ou use o Postman/Insomnia:**
- **URL**: `http://localhost:8080/instance/create`
- **Method**: POST
- **Headers**:
  - `apikey`: `your_evolution_api_key`
  - `Content-Type`: `application/json`
- **Body**:
```json
{
  "instanceName": "zaptfood",
  "qrcode": true
}
```

### 1.2 Obter QR Code
```bash
curl -X GET http://localhost:8080/instance/connect/zaptfood \
  -H "apikey: YOUR_API_KEY"
```

**Resposta esperada:**
```json
{
  "base64": "data:image/png;base64,iVBORw0KG...",
  "code": "1@ABC123..."
}
```

### 1.3 Escanear QR Code
1. Abra o WhatsApp no celular
2. Vá em **Configurações** > **Aparelhos conectados**
3. Clique em **Conectar um aparelho**
4. Escaneie o QR Code retornado

## 2. Configurar Webhook para n8n

### 2.1 Definir Webhook
```bash
curl -X POST http://localhost:8080/webhook/set/zaptfood \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://host.docker.internal:5678/webhook/whatsapp",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT"
    ]
  }'
```

**Explicação:**
- `url`: O webhook do n8n (use `host.docker.internal` para acessar o host do Docker)
- `events`: Lista de eventos para monitorar (MESSAGES_UPSERT = mensagens recebidas)

## 3. Configurar n8n

### 3.1 Acessar n8n
1. Abra http://localhost:5678
2. Login: `admin` / Senha: `password`

### 3.2 Criar Workflow de Webhook
1. Clique em **New Workflow**
2. Adicione um nó **Webhook**
3. Configure:
   - **HTTP Method**: POST
   - **Path**: `whatsapp`
   - **Response Mode**: `On Last Node`

### 3.3 Importar Workflows Prontos
1. No n8n, clique em **Import from File**
2. Selecione `n8n/workflows/greeting_menu.json`
3. Repita para `vendor_login.json`

### 3.4 Configurar Variáveis de Ambiente no n8n
No n8n, vá em **Settings** > **Variables** e adicione:
- `EVOLUTION_API_URL`: `http://evolution_api:8080`
- `EVOLUTION_API_KEY`: `your_api_key`
- `EVOLUTION_INSTANCE`: `zaptfood`

## 4. Testar Integração

### 4.1 Enviar Mensagem de Teste
Envie "Oi" para o número do WhatsApp conectado.

**Esperado:**
O bot deve responder com o menu:
```
👋 Olá! Bem-vindo ao ZaptFood.

Escolha uma opção:
1. 🍔 Fazer Pedido
2. 🏪 Sou Vendedor
3. 🆘 Suporte
```

### 4.2 Verificar Logs
```bash
# Logs da Evolution API
docker logs -f evolution_api

# Logs do n8n
docker logs -f n8n
```

## 5. Comandos Úteis

### Listar Instâncias
```bash
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: YOUR_API_KEY"
```

### Status da Instância
```bash
curl -X GET http://localhost:8080/instance/connectionState/zaptfood \
  -H "apikey: YOUR_API_KEY"
```

### Enviar Mensagem Manualmente
```bash
curl -X POST http://localhost:8080/message/sendText/zaptfood \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Teste de mensagem"
  }'
```

### Deletar Instância
```bash
curl -X DELETE http://localhost:8080/instance/delete/zaptfood \
  -H "apikey: YOUR_API_KEY"
```

## 6. Atualizar .env com Credenciais

Adicione no arquivo `.env`:
```bash
EVOLUTION_API_KEY=suachaveaqui123
EVOLUTION_INSTANCE=zaptfood
```

## 7. Troubleshooting

### Problema: QR Code não aparece
- Verifique se a instância foi criada: `docker logs evolution_api`
- Tente acessar: http://localhost:8080/instance/qrcode/zaptfood

### Problema: Webhook não está recebendo mensagens
- Verifique a URL do webhook (deve usar `host.docker.internal` em Docker)
- Confirme que o n8n está listening no path correto
- Teste manualmente: `curl http://localhost:5678/webhook/whatsapp`

### Problema: Bot não responde
- Verifique se o workflow está ativo no n8n
- Confirme que as variáveis de ambiente estão configuradas
- Veja os logs do n8n: `docker logs -f n8n`

## 8. Próximos Passos

1. ✅ Evolution API + WhatsApp conectado
2. ✅ n8n configurado com workflows
3. 🔄 Continuar Fase 3: Gestão de Estoque (Lançar Rodada)
4. 🔄 Implementar catálogo de produtos
5. 🔄 Integrar pagamento Pix

---

**Documentação Oficial:**
- Evolution API: https://doc.evolution-api.com/
- n8n: https://docs.n8n.io/

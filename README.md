# 100 Cinco — Site de Pedidos + Painel em Tempo Real

Site de pedidos online com **painel administrativo em tempo real (polling 4s)** para acompanhamento e gestão dos pedidos. Substitui o envio antigo via Telegram por um backend próprio, seguro e profissional — pronto pra rodar na **Vercel**.

## Arquitetura

```
delivery100cinco/
├── api/
│   └── index.ts            # Entrada Serverless da Vercel (Express via serverless-http)
├── server/                 # Código backend compartilhado (dev local + Vercel)
│   ├── app.ts              # Factory do Express
│   ├── server.ts           # Bootstrap pra dev local (`npm run dev`)
│   ├── config.ts           # Loader de env com Zod
│   ├── lib/                # db (com cache p/ serverless), jwt, logger
│   ├── middleware/         # auth, validate, errorHandler
│   ├── models/             # Mongoose: Order, Admin
│   ├── routes/             # Express: auth, orders
│   ├── schemas/            # Zod: validação de entrada
│   ├── sockets/            # (no-op em serverless — frontend usa polling)
│   └── scripts/seedAdmin.ts
├── index.html              # Loja
├── checkout.html           # Finalização (POSTa no /api/orders)
├── pedido-sucesso.html
├── pedidos.html            # Painel admin
├── src/
│   ├── script.js           # Loja
│   ├── checkout.js
│   └── pedidos.js          # Painel (login, polling, sons, notificações)
├── styles/  assets/
├── package.json            # Raiz (deps + scripts)
├── tsconfig.json
├── vercel.json             # Rewrite /api/* → função serverless
└── .env.example
```

## Stack

**Frontend** — HTML + Tailwind (CDN) + Vanilla JS + Lucide Icons
**Backend** — Node 20+ • TypeScript • Express • serverless-http • Mongoose • Zod • bcryptjs • JWT • Helmet • Pino • express-rate-limit

## Funcionalidades

### Para o cliente
- Catálogo com busca e filtro
- Carrinho persistente em `localStorage`
- Checkout com ViaCEP
- Validação Zod no servidor
- **Fallback automático pro WhatsApp** se o backend cair

### Para o lojista (Painel em `/pedidos.html`)
- 🔐 Login com senha (JWT + bcrypt, rate limit 10 tentativas/15min)
- ⚡ Polling a cada 4s → **novo pedido aparece em até 4 segundos**
- 🔔 Som + notificação push do navegador quando chega pedido novo
- 📊 Stats do dia (total, ativos, faturamento)
- 🔍 Busca por nome/telefone
- 🎯 Filtro por status com contagem
- 🔄 Workflow Novo → Em Preparo → Saiu p/ Entrega → Entregue (+ Cancelar/Reabrir)
- 📜 Histórico de mudanças por pedido
- 💬 WhatsApp do cliente clicável
- 📱 Mobile-first, identidade visual coerente com a loja
- 💤 Reduz polling pra 15s quando aba está em background (economiza bateria/dados)

---

## 🚀 Setup local

### 1. MongoDB Atlas
1. https://www.mongodb.com/cloud/atlas → cluster M0 (grátis, 512MB).
2. **Database Access** → criar usuário com senha forte (NÃO use a senha que ficou exposta no histórico do chat — gere outra).
3. **Network Access** → adicione `0.0.0.0/0` (Vercel usa IPs dinâmicos).
4. **Connect** → "Connect your application" → copie a URI. **Inclua o nome do banco** no path:
   ```
   mongodb+srv://USER:SENHA@100cinco.abe6ckj.mongodb.net/delivery100cinco?retryWrites=true&w=majority
   ```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar env
```bash
cp .env.example .env
```

Edite o `.env`:
- `MONGODB_URI` — sua string do Atlas
- `JWT_SECRET` — gere com `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — credenciais do admin inicial

### 4. Criar admin
```bash
npm run seed:admin
```

### 5. Rodar dev local
```bash
npm run dev
```

Sobe em `http://localhost:3000`:
- Loja: `/`
- Checkout: `/checkout.html`
- Painel: `/pedidos.html`
- Health check: `/api/health`

---

## ☁️  Deploy na Vercel

### 1. Push pro Git
```bash
git add .
git commit -m "feat: backend + painel de pedidos em tempo real"
git push
```

### 2. Variáveis de ambiente na Vercel
No dashboard do projeto → **Settings → Environment Variables** → adicione:

| Variável | Valor |
|---|---|
| `MONGODB_URI` | sua string do Atlas (com nome do banco no path) |
| `JWT_SECRET` | gere com `crypto.randomBytes(64).toString('hex')` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://SEU-APP.vercel.app` (separe múltiplos domínios por vírgula) |
| `SERVE_STATIC` | `false` (Vercel já serve os HTMLs direto) |
| `ADMIN_USERNAME` | (só pra rodar seed) ex.: `admin` |
| `ADMIN_PASSWORD` | (só pra rodar seed) senha forte |

### 3. Deploy
Cada `git push` faz deploy automático. Aguarde o build terminar.

### 4. Criar o admin em produção
Tem 2 jeitos:

**Opção A — Localmente apontando pro Atlas (mais fácil):**
Já que seu `.env` local tem o `MONGODB_URI` da Atlas, basta:
```bash
npm run seed:admin
```
O usuário é criado direto no Atlas (mesmo banco que a Vercel usa).

**Opção B — Via Vercel CLI:**
```bash
npm i -g vercel
vercel link
vercel env pull .env.production.local
node --import tsx server/scripts/seedAdmin.ts
```

### 5. (Opcional) Apagar `ADMIN_PASSWORD` da Vercel
Depois do seed, remova `ADMIN_USERNAME` e `ADMIN_PASSWORD` das env vars da Vercel — elas só servem pro seed.

### 6. Testar
- Loja: `https://SEU-APP.vercel.app/`
- Painel: `https://SEU-APP.vercel.app/pedidos.html`
- Health: `https://SEU-APP.vercel.app/api/health` → deve retornar `{"ok":true,...}`

> **Sobre real-time na Vercel:** o plano Hobby/Pro não suporta WebSocket persistente (limite de 30-60s por invocação serverless). Por isso o painel usa **polling a cada 4 segundos** — novos pedidos aparecem em até 4s. Pra delivery isso é mais que suficiente, e como a aba minimiza pra 15s quando em background, o consumo de bandwidth é baixíssimo (~25GB/mês mesmo com a aba aberta o dia todo — bem dentro do limite Hobby de 100GB).

---

## 🔐 Segurança implementada

- Senhas com **bcrypt** (cost 12)
- **JWT** com expiração configurável + verificação em todas as rotas privadas
- **Rate limiting**: 10 logins / 15min, 10 pedidos / min, 120 req / min nas demais rotas
- **Helmet** com headers de segurança
- **CORS** restrito aos domínios configurados
- Validação **Zod** em todas as entradas (body, query, params)
- Logs com **redação** de tokens e senhas
- `trust proxy` configurado pra captar IP real atrás da Vercel
- Body size limit de 512 KB

## ⚠️ Pendências de segurança (FAÇA AGORA)

1. **Token Telegram exposto** — `7771133074:AAH...` ficou hardcoded no `checkout.html` antigo (ainda está no git history). Vá em [@BotFather](https://t.me/BotFather) → `/revoke` ou `/token` no bot e gere um novo. Mesmo que não vá mais usar.
2. **Senha do MongoDB exposta** — a senha `NeaKnzlxLOgPz8Ih` foi colada no chat. Vá em Atlas → Database Access → Edit user → Reset Password. Use a nova senha nas env vars da Vercel.

## 🛠️ Customização rápida

**Trocar número do WhatsApp de fallback** (quando o backend cai):
- `checkout.html` → constante `WHATSAPP_FALLBACK` no topo do `<script>` (`5547999999999` → seu número com 55+DDD).

**Mudar URL da API no painel** (caso você queira separar frontend/backend em domínios diferentes):
```html
<script>window.PEDIDOS_API_BASE = 'https://api.seudominio.com';</script>
<script src="src/pedidos.js"></script>
```

**Mudar intervalo de polling**:
- `src/pedidos.js` → `POLL_INTERVAL_MS` (padrão 4000) e `POLL_INTERVAL_HIDDEN_MS` (padrão 15000).

**Adicionar mais admins**: ajuste `.env`, rode `npm run seed:admin` de novo (faz upsert).

## 📋 Status workflow

```
Novo  →  Em Preparo  →  Saiu p/ Entrega  →  Entregue
  ↓          ↓                  ↓
                  Cancelado
```

Cada mudança é registrada em `statusHistory` com timestamp e nome do operador.

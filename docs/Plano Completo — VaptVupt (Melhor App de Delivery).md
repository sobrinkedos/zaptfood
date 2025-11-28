## Visão
- VaptVupt: delivery “pronto-agora” com jornada 2–3 toques, WhatsApp-first e apps nativos complementares. Referências: atendimento conversacional e lista por proximidade em docs/zaptfood.md:111–167, 1451–1481.
- Diferenciais: disponibilidade em tempo real (TTL), poucos SKUs por vendedor, geolocalização e pagamento instantâneo. Regras de negócio em docs/zaptfood.md:185–193, 1374–1383.

## Objetivos
- Conversão: ≥ 60–70% da jornada WhatsApp → pagamento em ≤ 3 min (docs/zaptfood.md:206–213, 958–965).
- SLA entrega: 15–30 min para “food-hot”; até 40 min com entrega própria.
- Escalabilidade: arquitetura modular para multi-produto e multi-cidade.

## Personas e Canais
- Cliente: WhatsApp + web-view de tracking; app nativo cliente (fase pós-MVP) para push rico e fidelidade.
- Vendedor: onboarding web responsivo dentro do WhatsApp (PWA) e operação diária 100% WhatsApp; app Parceiro (fase 2) para rotinas avançadas (docs/zaptfood.md:578–589, 636–645).
- Motoboy: app Flutter mínimo (login, aceitar, rota, entregue) com push FCM (docs/zaptfood.md:2713–2769, 2916–2933).

## Arquitetura de Referência
- Opção A (compliance): Node.js + Supabase (Postgres, RLS, Realtime, Storage) + WhatsApp Cloud API + Stripe/Mercado Pago + FCM. Back-end e modelo relacional em docs/zaptfood.md:2314–2456.
- Opção B (MVP low-code): n8n orquestração + Evolution API (WhatsApp) + Supabase/Firestore; migração gradual das rotas críticas para Node à medida que escala (docs/zaptfood.md:1954–2247, 2248–2312).
- Serviços: API `webhook`, `orders`, `vendors`, `deliveries`; gateways de pagamento; push; monitoramento.

## Modelo de Dados (Supabase)
- `categories`, `vendors`, `skus` (≤ 4 por vendedor), `listings` (TTL, qty, geohash/location), `orders` (status, fee, code4digits), `stock_adjusts`, `delivery_partners`, `deliveries`. Estrutura e RLS em docs/zaptfood.md:2377–2456.
- Multi-produto: campos `category`, `type` (fornada|estoque), `weightKg`, `has_own_delivery` e `maxSkus` (docs/zaptfood.md:1368–1397, 1298–1305).

## Fluxos Principais
- Cliente: “Oi” → categoria → produto → vendedor próximo → quantidade → pagamento (Pix/cartão) → tracking → avaliação (docs/zaptfood.md:1451–1481, 334–350, 360–376).
- Vendedor: cadastro (web) → lançar rodada (“Lançar qtd preço”) → decrementar (“-n”) → encerrar → resumo fornada (docs/zaptfood.md:578–621, 667–744, 830–944, 722–733).
- Motoboy (parceiro): cadastro → ficar online → aceitar corrida → retirada → entrega (código 4 dígitos se entrega própria) → pagamento (docs/zaptfood.md:2719–2769, 2847–2893).
- Entrega própria: oferta ao cliente, validação por código 4 dígitos e timer (docs/zaptfood.md:1225–1233, 1235–1238).

## Regras de Negócio
- TTL fornada: 30–45 min; “estoque-pronto” só se `hasOwnDelivery=true` e raio ≤ 2 km; peso total ≤ 30 kg por pedido (docs/zaptfood.md:2158–2165, 1507–1513, 1374–1383).
- ≤ 4 SKUs por vendedor (decisão hard-limit); ordenação por distância; comissão 15% no produto (frete do vendedor fica fora) (docs/zaptfood.md:1374–1383, 1046–1047, 1235–1237).
- Pagamento: Pix timeout 10 min (fallback cartão); cancelamento < 5 min reembolso total (docs/zaptfood.md:189–191, 1048–1050).

## Segurança, LGPD e Compliance
- LGPD: opt-in conversacional, comando “/apagar” para deleção (docs/zaptfood.md:191–193, 2195–2199).
- RLS habilitada nas tabelas sensíveis; PCI-DSS via gateway (não armazenar cartão) (docs/zaptfood.md:2453–2456, 1037–1039).
- Rate limit e idempotência em webhooks de pagamento e mensagens.

## Observabilidade e KPIs
- KPIs: conversão, tempo “mensagem→pagamento”, sucesso de dispatch, cancelamentos, NPS (docs/zaptfood.md:206–213, 1084–1089, 2949–2954, 2202–2207).
- Alertas: latência webhook, Pix não identificado, % cancelamentos (docs/zaptfood.md:2203–2207).

## Produtos e Catálogo
- “Food-hot” (frango, costela, feijoada, pizza fatia) segue regra fornada (perfeito fit) (docs/zaptfood.md:1167–1177).
- “Estoque-pronto” (água, gás, gelo): só aparece com entrega própria e raio ≤ 2 km (docs/zaptfood.md:1507–1513, 1252–1257).
- Jornada por categorias → produto → vendedores ativos (docs/zaptfood.md:1439–1499).

## Integrações
- WhatsApp: Cloud API (preferível) e/ou Evolution API (rápido para MVP), List/Buttons, templates aprovados (docs/zaptfood.md:156–165, 1612–1625).
- Pagamentos: Stripe/Mercado Pago com webhook e intent/QR Pix (docs/zaptfood.md:335–350, 1864–1875).
- Push (FCM), Maps, transcrição voz (Whisper opcional).

## Roadmap (90 dias)
- S1–S2: subir WhatsApp (Cloud API), back-end Node + Supabase, webhook “hello-world” (docs/zaptfood.md:1069–1074).
- S3–S4: cadastro vendedor + lançar/decrementar; lista por proximidade; Pix first (docs/zaptfood.md:1075–1077).
- S5–S6: motoboy dispatch + segurança, LGPD, templates Meta (docs/zaptfood.md:1078–1079).
- S7–S8: campanha QR, piloto 1 bairro, ajustes e go-live (docs/zaptfood.md:1080–1081).

## Cronograma e Entregáveis
- Semana 1: infra (Supabase, API, Cloud API), schema SQL, credenciais.
- Semana 2: onboarding web, aprovação admin, intents iniciais.
- Semana 3: lançar rodada, decremento, TTL/esgotado, auditoria `stock_adjusts`.
- Semana 4: catálogo por categoria, proximidade (geohash/GEOGRAPHY), Pix.
- Semana 5: pedidos, webhook pago, dispatch motoboy, tracking.
- Semana 6: LGPD (/apagar), RLS, rate limit, alertas, testes carga.
- Semana 7: templates Meta, materiais onboarding, growth QR.
- Semana 8: beta público, instrumentação KPIs e tuning.

## Critérios de Aceitação
- Conversão WhatsApp→pago ≥ 60%; tempo compra ≤ 3 min; SLA entrega ≤ 30 min.
- 0 saldo negativo; 95% fornadas zeram sem cancelos (docs/zaptfood.md:777–779, 932–935).
- Latência webhook < 2 s; templates Meta aprovados; LGPD funcional.

## Riscos e Mitigação
- Bloqueio de templates (submeter com antecedência — docs/zaptfood.md:1091–1099).
- Vendedor não decrementar (atalhos, lembretes — docs/zaptfood.md:693–703, 1095–1096).
- Latência alta (co-localizar serviços; mover rotas críticas para Node).
- Alta demanda (SQL idempotente; filas; Realtime para estado).

## Plano de Qualidade
- Testes: unitários (saldo negativo, duplicidade de pagamento), integração (webhook), carga (k6 100 req/s), monitoramento com dashboards.
- Segurança: RLS, JWT service role só no back-end, segredos em vault.

## Próximos Passos
- Escolher arquitetura principal (Cloud API + Node+Supabase; manter n8n/Evolution para orquestração onde fizer sentido).
- Provisionar Supabase, aplicar DDL, habilitar RLS.
- Solicitar/aprovar templates Meta; registrar número WABA.
- Implementar rotas núcleo (`/webhook`, `/order/create`, `/vendor/decrement`) e seed de categorias.
- Rodar piloto com 2 vendedores e 3 motoboys em 1 bairro; medir KPIs e ajustar.

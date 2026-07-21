# CRM de WhatsApp — Laravel 13 + MariaDB

Port completo de **wacrm** (CRM de WhatsApp original en Next.js 16 + Supabase, en `C:\xampp_82_12\htdocs\wacrm-main`) a **Laravel 13 + Inertia.js + React 18 + MariaDB 10.11** (XAMPP, PHP 8.3).

## Estado: port completo + mejoras (2026-07-10)

Suite de tests: **82 tests / 418 aserciones en verde** (`php artisan test`).

Ronda 9 — Equipo centralizado (2026-07-19, Fase 7 del Komo Hub) — suite 90/90 (474):
- **`ProvisionController` extendido**: acepta `account_id` (existente) + `account_role` (`owner|admin|agent|viewer`). Si llegan, el user se une a la cuenta remota con ese rol (patrón MemberProvisioner del hub); si no, comportamiento original (owner de cuenta nueva). Test `ProvisionMemberTest`.

Ronda 8 — Notificaciones consolidadas (2026-07-19, Fase 5 del Komo Hub) — suite 89/89 (468):
- **`GET /api/v1/notifications`** con nuevo scope `notifications:read` (agregado a `ApiKey::SCOPES` — TeamController y ProvisionController validan el scope nuevo). Devuelve `{data:[{id,type,title,body,link_path,created_at,read_at}]}` filtrado por el `created_by` de la key (el user "hub"), con `?since=` y `?limit=`. `link_path` = `/inbox?conversation={id}` o `/notifications`. Test en `NotificationsApiTest`.
- **`SsoController@consume` acepta `?next=`** (path relativo, misma-host): tras el login redirige a la ruta destino en vez del dashboard. El hub encadena el salto con la ruta del deep-link — un solo clic desde la campana consolidada aterriza al usuario en la conversación exacta ya logueado.

Ronda 7 — Provisión del ecosistema (2026-07-16, Fase 3 del Komo Hub) — suite 88/88 (463):
- **`POST /api/v1/provision`** (`Api\V1\ProvisionController`, sin api.key): firmado HMAC del body con `HUB_PROVISION_SECRET` (`.env` + `services.hub.provision_secret`, mismo valor en las 4 apps). Crea user+account (idempotente por email; password aleatoria si no llega — acceso vía SSO), emite API key con los scopes pedidos y registra/actualiza el webhook saliente hacia el komo (URL+secret que manda el hub). Tests en `ProvisionTest`.
- ✅ e2e verificado (2026-07-19): el 404 intermitente que aparecía en pruebas locales anteriores era por procesos `php artisan serve` huérfanos escuchando el mismo puerto — matarlos con `Stop-Process` antes de levantar. Aprovisionamiento completo 7/7 pasos OK.

Ronda 6 — SSO del ecosistema (2026-07-16, Fase 2 del Komo Hub en `C:\xampp_82_12\htdocs\laravel_nuevo_proyecto`):
- **`SsoController@consume`** (ruta pública `GET /sso/consume`, `APP_ID='wacrm'`): acepta tokens de un solo uso del hub — firma HMAC (`HUB_SSO_SECRET` en `.env` y `services.hub.sso_secret`, mismo valor en las 4 apps), expiración 60s, nonce anti-replay en cache. Login por email + regenerate → dashboard.
- **`SESSION_COOKIE=wacrm_session`** en `.env` (las cookies no se aíslan por puerto en localhost). Tests en `SsoConsumeTest` — suite total **85/85 (442)**.

Ronda 5 — atribución de anuncios Click-to-WhatsApp (2026-07-15):
- **`/api/v1/contacts` acepta `?tag_id=`** (filtro server-side por tag) — lo usa meta_ads para armar Custom Audiences sin paginar el catálogo completo. Test en `ApiContactsTagFilterTest`.
- **Referral de Meta capturado**: migración 2026_07_15 añade `messages.referral` (json, cast array) y `conversations.entry_ad_id` (indexado). `InboundProcessor` extrae `$msg['referral']` ({source_id: AD_ID, headline, source_url…}) y lo guarda en el mensaje; `entry_ad_id` solo se escribe la PRIMERA vez (preserva la atribución original — referrals posteriores no lo pisan).
- **Webhook saliente enriquecido**: el evento `message.received` ahora incluye `message.referral` en el payload — el komo lo guarda como `leads.source_ref` y meta_ads calcula ROAS con eso. Sin cambios de contrato para receptores que lo ignoren.
- Tests en `MessageReferralTest` (guardado, preservación de atribución, payload del webhook).

Ronda 3 (2026-07-11):
- **Encabezados multimedia en broadcasts**: `broadcasts.header_media_url` (migración 2026_07_11) + componente header en `SendBroadcastJob::buildComponents` (link que Meta descarga; tipo tomado del `header_type` de la plantilla, cacheado por job). El creador de broadcasts pide la URL cuando la plantilla elegida tiene header image/video/document.
- **Creación de broadcasts extraída** a `Services/Broadcasts/Creator.php` (lanza InvalidArgumentException con mensaje de usuario) — compartida por BroadcastController y la API.
- **API pública broadcasts**: GET/POST `/api/v1/broadcasts` + GET `/{id}` (con `recipients_by_status`), scopes nuevos `broadcasts:read` / `broadcasts:write`.
- **Presencia**: heartbeat `POST /presence/ping` desde el layout cada 60s (online = visto <2 min); puntito verde/gris en Settings/Team.
- El usuario también rediseñó `AuthenticatedLayout.jsx` (sidebar colapsable) — el heartbeat de presencia vive ahí; cuidado al editarlo.

Ronda 4 — rediseño Velzon (2026-07-11):
- Estilo aplicado a todas las páginas nuevas: cards `rounded-2xl shadow-sm border border-gray-100`, iconos en cajas de gradiente con `shadow-lg`, header con `text-2xl sm:text-3xl font-bold` + subtítulo `text-sm text-gray-400`, botones primarios con gradiente + `shadow-lg shadow-{color}-500/20`, tablas con `bg-gray-50/80` header y filas `hover:bg-gray-50` con acciones que aparecen en hover (`opacity-0 group-hover:opacity-100`).
- Paleta: marca `from-[#045474] to-[#1c486c]`, emerald (positive), blue (info), purple (data), amber (warning), rose/red (danger). Cada tipo de entidad tiene su gradiente característico consistente entre páginas.
- Badges de estado con formato `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1` + dot de color.
- Rediseñadas: Templates/Index, Broadcasts/{Index,Show,Create}, Automations/{Index,Edit,Logs}, Flows/{Index,Edit,Runs}, Pipelines/Index (Kanban con drag&drop + gradientes por etapa), Notifications/Index, Settings/{WhatsApp,Ai,Team}. Los rediseñados por el usuario (Dashboard, Contacts/Index) no se tocaron.

Ronda 2 de mejoras (2026-07-11):
- **Webhooks salientes**: `Services/Webhooks/Dispatcher.php` (eventos `message.received`, `contact.created`, `broadcast.completed`) + `Jobs/DeliverWebhookJob` (POST JSON firmado HMAC-SHA256 en `X-Webhook-Signature`; 10 fallos consecutivos → autodesactivación). Disparo desde InboundProcessor, ContactController y SendBroadcastJob. CRUD en Settings/Team (secreto `whsec_…` mostrado una vez). Ojo en tests: los stubs de `Http::fake` se acumulan y el primero que coincide gana.
- **Rate limiting**: limiters en AppServiceProvider — `whatsapp-webhook` 600/min por IP, `public-api` 120/min por API key (aplicados en rutas).
- **Inbox**: responder citando (`reply_to_message_id` + context wamid a Meta), reacciones del agente (endpoint `inbox.react`, emojis rápidos al hover), panel de notas internas del contacto (`contact_notes` por fin con UI, endpoints `inbox.notes`).
- El usuario rediseñó Dashboard.jsx y Contacts/Index.jsx con su propio estilo (gradientes/iconos SVG) — respetar ese estilo al tocar esas páginas.

Mejoras aplicadas sobre el port base:
- **Tiempo real (Reverb)**: evento `App\Events\InboxUpdated` (ShouldBroadcastNow, canal privado `account.{accountId}` en routes/channels.php) emitido desde observers en AppServiceProvider (Message::created, Conversation::updated) envueltos en `rescue()` — si Reverb está caído no rompe nada. Cliente: `resources/js/echo.js` (Echo+pusher-js), el inbox escucha y refetchea; polling de respaldo a 30s. Arrancar con `php artisan reverb:start` (4º proceso).
- **Media desde inbox**: `MetaApi::uploadMedia/sendMedia`, `Messenger::sendMedia` (tipo deducido del MIME), endpoint `inbox.send-media`, botón 📎.
- **Embeddings semánticos**: `Services/Ai/Embeddings.php` (OpenAI text-embedding-3-small), Chunker vectoriza al indexar si hay `embeddings_api_key`, ReplyGenerator hace ranking coseno en PHP (límite 500 chunks, umbral 0.2) con fallback léxico. Botón "Reindexar" en Settings/Ai.
- **Kanban**: reordenar etapas (↑↓, `stages.move` intercambia posiciones). **Ownership**: `team.members.transfer` (solo owner; el anterior pasa a admin).

## Entorno

- BD: `laravel_crm_whatsapp` (root sin contraseña). Tests contra `laravel_crm_whatsapp_test` (MySQL, **no** sqlite — falta el driver pdo_sqlite; configurado en `phpunit.xml`).
- Usuario de pruebas: `admin@gmail.com` / `admin123` (owner de su cuenta).
- Operación local: `php artisan serve` + `php artisan queue:work` (cola database) + `php artisan schedule:work` (broadcasts programados, waits de automatizaciones, timeouts de flows).
- Frontend: `npm run build` (Vite). Si `npm install` falla, usar `--legacy-peer-deps`.
- Env WhatsApp: `META_APP_SECRET` (firma HMAC del webhook) y `META_GRAPH_VERSION` en `.env`; credenciales del número se guardan por cuenta en Ajustes → WhatsApp.

## Arquitectura

**Multi-tenant por `account_id`** (reemplazo del RLS de Supabase): todas las tablas de datos llevan `account_id`; el trait `App\Models\Concerns\BelongsToAccount` da `forAccount()`. **Toda query debe pasar por ese scope** — los controladores validan pertenencia con `abort_if($model->account_id !== $request->user()->account_id, 403)`.

- UUIDs en todas las PK (`HasUuids`). `users` fusiona el antiguo `profiles` (account_id, account_role: owner/admin/agent/viewer con jerarquía en `User::hasRoleAtLeast()`).
- Laravel 13 usa atributos PHP `#[Fillable]` / `#[Hidden]` en los modelos.
- Secretos (token WhatsApp, API key IA, secretos de webhooks) con cast `encrypted` (usa APP_KEY; rotarla invalida los tokens guardados).
- El pivot `contact_tags` usa PK compuesta (attach() no rellena uuid id).
- Campos nullable validados: leer con `?? null` del array validado.

### Módulos y piezas clave

| Módulo | Backend | UI (resources/js/Pages) |
|---|---|---|
| WhatsApp core | `Services/WhatsApp/{MetaApi,InboundProcessor,Messenger}.php`; webhook `/webhooks/whatsapp` (GET verify + POST HMAC, sin CSRF en bootstrap/app.php); proxy media `/whatsapp/media/{id}` | Settings/WhatsApp.jsx |
| Inbox | `InboxController` (polling JSON cada 4s, enviar, asignar→notifica, estado, borrador IA) | Inbox/Index.jsx |
| Contactos | `ContactController` (dedup por `phone_normalized` único por cuenta, import CSV), tags, custom fields | Contacts/Index.jsx |
| Plantillas | `TemplateController` (sync/submit con Meta vía WABA ID) | Templates/Index.jsx |
| Broadcasts | `BroadcastController` + `Jobs/SendBroadcastJob` (variables {name},{phone},{email},{company}); `broadcasts:process-scheduled` cada minuto | Broadcasts/*.jsx |
| Pipelines | `Pipeline/Stage/DealController` (crear siembra 5 etapas; drag&drop = PATCH solo stage_id) | Pipelines/Index.jsx (DnD HTML5 nativo) |
| Automatizaciones | `Services/Automations/Engine.php` — triggers inbound_message/new_contact/keyword; pasos send_message/add_tag/remove_tag/condition/wait/webhook; waits → `automation_pending_executions` reanudadas por `automations:process-pending`; eventos vía `ProcessAutomationEventJob` (post-commit) | Automations/{Index,Edit,Logs}.jsx (árbol children_yes/children_no, máx 3 niveles) |
| Flows (chatbot) | `Services/Flows/Runner.php` — nodos send_message/send_buttons/send_list/collect_input/condition/set_tag/http_fetch/handoff/end; edges por node_key en config; **un run activo por contacto** (columna única `active_contact_key`, mantenida en `FlowRun::booted()`); reprompts→on_exhaust; idempotencia por wamid; `flows:process-timeouts`; agente que escribe pausa el run | Flows/{Index,Edit,Runs}.jsx (editor de cards con validación de edges en servidor) |
| IA | `Services/Ai/{Client,ReplyGenerator,Chunker}.php` (OpenAI/Anthropic BYO key; retrieval FULLTEXT + fallback LIKE — el FULLTEXT de InnoDB no ve filas de transacciones no confirmadas, importa en tests); `Jobs/AiAutoReplyJob` (tope por conversación, respeta flows, agente apaga bot vía `ai_autoreply_disabled`) | Settings/Ai.jsx |
| API pública | `routes/api.php` `/api/v1` + middleware `api.key` (Bearer, hash SHA-256, scopes contacts:read/write, conversations:read, messages:write) | claves en Settings/Team.jsx |
| Equipos | `TeamController` — invitaciones por link (token hasheado, 7 días, single-use, registro exprés en `/invite/{token}`); expulsar crea cuenta propia vacía al expulsado | Settings/Team.jsx, Invitations/Accept.jsx |
| Notificaciones | `NotificationController`; contador compartido en `HandleInertiaRequests` (prop `unreadNotifications`) | Notifications/Index.jsx + campana en el layout |
| Dashboard | `DashboardController` (métricas + mensajes 7 días) | Dashboard.jsx |

### Orden de procesamiento de un mensaje entrante

`InboundProcessor` (transacción: contacto→conversación→mensaje→broadcast replied) y después del commit despacha en cola: `ProcessFlowMessageJob` (el flow activo consume el mensaje o se evalúan triggers) → `ProcessAutomationEventJob` (new_contact / inbound_message / keyword) → `AiAutoReplyJob` (se abstiene si hay flow activo).

## Pendiente menor

i18n (la UI está en español fijo; el original usaba next-intl), grabación de audio en el inbox (requiere opus-recorder — Meta solo acepta ogg/opus y MediaRecorder de Chrome produce webm; hoy se puede adjuntar el audio como archivo), y para producción: SMTP real (hoy driver log), HTTPS, cron `schedule:run` y supervisión de `queue:work`/`reverb:start`.

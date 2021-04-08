# 句 \_句 Excels Autobot

Rellena el _excel_ de _People Development_ desde el confort de tu propia casa.

## Infraestructura

Todo está montado con [Cloudflare Workers](https://workers.cloudflare.com/), su `cron` y su KV (key-value).

## Desarollo

Localmente puedes correr lostests y desarollar con solo `node` (combueba la versión en `.nvmrc`).

### Levantar una instancia local

Es posible levantar una instancia local y apuntar un bot de Slack a esta instancia para hacer pruebas.

1. Primero necesitamos levantar la instancia con Wrangler [`Wrangler`](https://developers.cloudflare.com/workers/cli-wrangler/install-update): `$ wrangler dev`.
1. Crear un tunel con `https` a nuestra nueva instancia. `$ ngrok http 8787`.
1. Necesitamos tener un [bot en slack](https://api.slack.com/apps/) instalado en algún workspace con los siguientes permisos:
   - Interactive Components
     - Interactivity: `on`, request URL: `[tunel]/slack/interactive`
     - Select Menus: Options load URL: `[tunel]/slack/options-load`
   - Event Subscriptions
     - Request URL: `[tunel]/slack/actions` \* _Es necesario tener levantado el servidor antes de configurar este paso_.
     - _Subscribe to bot events_: `app_home_opened`
   - Bots
     - Home Tab `On` y Messages Tab `On`.
   - Permissions
     - Scopes: `chat:write`

## TODO

- Copiar a toda la gente?
- Frontend de quienes están activos?
- Cron
- Logging context
- Correr el CI en Actions

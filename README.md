# 句 \_句 Excels Autobot

Fill your _People Development_ from the confort of your own Slack.

Every friday, before the `Excels` meeting, the slack bot queries each user that has not yet filled the table with their values.

## Architecture

Everything is mounted in [Cloudflare Workers](https://workers.cloudflare.com/), their `cron` and their key value storage.

## Development

Prequisitos: [`Wrangler`](https://developers.cloudflare.com/workers/cli-wrangler/install-update), `git`, `node` (check `.nvmrc`). Ayuda tener `ngrok`

1. `$ git clone`
1. `$ npm install`
1. `$ wrangler dev`

## TODO

- Copiar a toda la gente?
- Frontend de quienes están activos
- Borrar el mensaje del última semana si ya lo había mandado
- Cron
- Logging context
- Tests?
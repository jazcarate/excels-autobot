# 句 \_句 Excels Autobot

Fill your _People Development_ from the confort of your own Slack.

Every friday, before the `Excels` meeting, the slack bot queries each user that has not yet filled the table with their values.

## Architecture

Everything is mounted in [Cloudflare Workers](https://workers.cloudflare.com/), their `cron` and their key value storage.

1. Every so often (configured by the `cron`) we querty air table to figure out

## Development

1. `$ git clone`
1. `$ npm install`
1. `$ make dev`

### Environment

To connect to both AirTable and Slack you'll need some token configurations.
Check en envarionment varisbles in `src/environment.d.ts`.

## TODO

- Upload sourcemaps in build pipeline (https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/)
- Check slack token
- Growth es 1-3
- Copiar a toda la gente?
- Frontend de quienes están activos
- Copiar a esta semana al resto de la gente
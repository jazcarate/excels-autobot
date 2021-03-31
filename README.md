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

## TODO

- Upload sourcemaps in build pipeline (https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/)
- Check slack token
- Copiar a toda la gente?
- Frontend de quienes están activos

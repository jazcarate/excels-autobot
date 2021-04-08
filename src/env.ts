import { Env } from './types'

// From webpack DefinePlugin + GitRevisionPlugin
declare const COMMITHASH: string

// From cloudflare workers
declare const SLACK_BOT_TOKEN: string
declare const AIRTABLE_KEY: string
declare const SENTRY_PROJECT_ID: string
declare const SENTRY_PROJECT_KEY: string
declare const SLACK_BOT_SIGNING_SECRET: string

// From cloudflare workers KV
declare const USERS_KV: KVNamespace

const env: Env = {
  repo: {
    comithash: COMMITHASH,
  },
  environment: process.env.NODE_ENV,
  slack: {
    verifySign: true,
    token: SLACK_BOT_TOKEN,
    signSecret: SLACK_BOT_SIGNING_SECRET,
  },
  airTable: {
    key: AIRTABLE_KEY,
  },
  sentry: {
    projectId: SENTRY_PROJECT_ID,
    key: SENTRY_PROJECT_KEY,
  },
  io: {
    fetch,
    kv: USERS_KV,
    now: () => new Date(),
  },
}

export default env

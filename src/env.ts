// From webpack DefinePlugin + GitRevisionPlugin
declare const COMMITHASH: string

// From cloudflare workers
declare const SLACK_BOT_TOKEN: string
declare const AIRTABLE_KEY: string
declare const SENTRY_PROJECT_ID: string
declare const SENTRY_PROJECT_KEY: string

export default {
  repo: {
    comithash: COMMITHASH,
  },
  environment: process.env.NODE_ENV,
  slack: {
    token: SLACK_BOT_TOKEN,
  },
  airTable: {
    key: AIRTABLE_KEY,
  },
  sentry: {
    projectId: SENTRY_PROJECT_ID,
    key: SENTRY_PROJECT_KEY,
  },
}

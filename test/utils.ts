import { Env } from '../src/types'

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

export function testEnv(config: RecursivePartial<Env> = {}): Env {
  const testEnv: Env = {
    repo: {
      comithash: 'COMMITHASH',
    },
    environment: 'test',
    slack: {
      token: 'SLACK_BOT_TOKEN',
      signSecret: 'SLACK_BOT_SIGNING_SECRET',
    },
    airTable: {
      key: 'AIRTABLE_KEY',
    },
    sentry: {
      projectId: 'SENTRY_PROJECT_ID',
      key: 'SENTRY_PROJECT_KEY',
    },
  }

  return Object.assign(testEnv, config)
}

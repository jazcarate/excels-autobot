import { expect } from 'chai'
import { Env, RecursivePartial } from '../src/types'
import { KVMock } from './mocks'

export function testEnv(config: RecursivePartial<Env> = {}): Env {
  const testEnv: Env = {
    repo: {
      comithash: 'COMMITHASH',
    },
    environment: 'test',
    slack: {
      verifySign: false,
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
    io: {
      fetch: () => expect.fail('No debería haber hecho un fetch'),
      kv: new KVMock(),
      now: () => new Date(Date.parse('01 Jan 1970 00:00:00 GMT')),
    },
  }

  return mergeDeep(testEnv, config)
}

//https://stackoverflow.com/a/34749873
function mergeDeep(target: any, ...sources: any[]): any {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeep(target, ...sources)
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}

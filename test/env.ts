import { Env } from '../src/types'

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

class KVMock implements KVNamespace {
  db: {};

  get(key: string): KVValue<string>
  get(key: string, type: 'text'): KVValue<string>
  get<ExpectedValue = unknown>(key: string, type: 'json'): KVValue<ExpectedValue>
  get(key: string, type: 'arrayBuffer'): KVValue<ArrayBuffer>
  get(key: string, type: 'stream'): KVValue<ReadableStream<any>>
  get(key: any, type?: any): KVValue<any> {
    return Promise.resolve(this.db[key]);
  }
  put(key: string, value: string | ArrayBuffer | ReadableStream<any> | FormData, options?: { expiration?: string | number; expirationTtl?: string | number }): Promise<void> {
    this.db[key] = value
    return Promise.resolve();
  }
  delete(key: string): Promise<void> {
    delete this.db[key]
    return Promise.resolve()
  }
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number }[]; list_complete: boolean; cursor: string }> {
    throw new Error('Method not implemented.')
  }
}


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
      fetch: () => Promise.reject("foo"),
      kv: new KVMock(),
      now: () => new Date(Date.parse('01 Jan 1970 00:00:00 GMT'))
    }
  }

  return mergeDeep(testEnv, config)
}


//https://stackoverflow.com/a/34749873
function mergeDeep(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

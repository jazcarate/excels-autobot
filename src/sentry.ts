import env from './env'

const SENTRY_PROJECT_ID = env.sentry.projectId
const SENTRY_KEY = env.sentry.key
const APP = 'excels-autobot'
const ENV = env.environment
const RELEASE = env.repo.comithash
const TAGS = { app: APP }
const SERVER_NAME = `${APP}-${ENV}`

const CLIENT_NAME = 'joaquin-azcarate-cloudflare-worker'
const CLIENT_VERSION = '1.0.0'
const RETRIES = 5

export async function log(err: Error, request: Request) {
  const body = JSON.stringify(toSentryEvent(err, request))
  console.error(
    JSON.stringify({ errName: err.name, errMessage: err.message, body }),
  )

  for (let i = 0; i <= RETRIES; i++) {
    const res = await fetch(
      `https://sentry.io/api/${SENTRY_PROJECT_ID}/store/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': [
            'Sentry sentry_version=7',
            `sentry_client=${CLIENT_NAME}/${CLIENT_VERSION}`,
            `sentry_key=${SENTRY_KEY}`,
          ].join(', '),
        },
        body,
      },
    )
    if (res.status === 200) {
      return
    }
    console.error({ httpStatus: res.status, ...(await res.json()) })
  }
}

function toSentryEvent(err: Error, request: Request) {
  const errType = err.name
  const frames = parse(err)
  const extraKeys = Object.keys(err).filter(
    (key) => !['name', 'message', 'stack'].includes(key),
  )
  return {
    event_id: uuidv4(),
    message: errType + ': ' + (err.message || '<no message>'),
    exception: {
      values: [
        {
          type: errType,
          value: err.message,
          stacktrace: frames.length ? { frames: frames.reverse() } : undefined,
        },
      ],
    },
    extra: extraKeys.length
      ? {
          [errType]: extraKeys.reduce(
            // @ts-ignore
            (obj, key) => ({ ...obj, [key]: err[key] }),
            {},
          ),
        }
      : undefined,
    tags: TAGS,
    platform: 'javascript',
    environment: ENV,
    server_name: SERVER_NAME,
    timestamp: Date.now() / 1000,
    request:
      request && request.url
        ? {
            method: request.method,
            url: request.url,
            headers: request.headers,
            data: request.body,
          }
        : undefined,
    release: RELEASE,
  }
}

function parse(err: Error) {
  return (err.stack || '')
    .split('\n')
    .slice(1)
    .map((line) => {
      if (line.match(/^\s*[-]{4,}$/)) {
        return { filename: line }
      }

      // From https://github.com/felixge/node-stack-trace/blob/1ec9ba43eece124526c273c917104b4226898932/lib/stack-trace.js#L42
      const lineMatch = line.match(
        /at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/,
      )
      if (!lineMatch) {
        return
      }

      return {
        function: lineMatch[1] || undefined,
        filename: lineMatch[2] || undefined,
        lineno: +lineMatch[3] || undefined,
        colno: +lineMatch[4] || undefined,
        in_app: lineMatch[5] !== 'native' || undefined,
      }
    })
    .filter(Boolean)
}

function uuidv4() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return [...bytes].map((b) => ('0' + b.toString(16)).slice(-2)).join('') // to hex
}

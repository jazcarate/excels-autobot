import env from './env'
import { handleRequest } from './handler'
import { log } from './sentry'

addEventListener('fetch', (event) => {
  console.log(JSON.stringify(env))

  event.respondWith(
    handleRequest(event.request).catch((err: Error) =>
      log(err, event.request).then(
        () => new Response(err.name, { status: 500 }),
      ),
    ),
  )
})

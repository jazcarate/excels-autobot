import { handleRequest } from './handler'
import { log } from './sentry'

addEventListener('fetch', (event) => {
  const req = event.request.clone()
  event.respondWith(
    handleRequest(event.request).catch((err: Error) => {
      event.waitUntil(log(err, req))
      return new Response(err.name, { status: 500 })
    }),
  )
})

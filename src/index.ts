import { handleRequest } from './handler'
import { log } from './sentry'

declare const COMMITHASH: string;

addEventListener('fetch', (event) => {
  console.log(COMMITHASH);

  event.respondWith(
    handleRequest(event.request).catch((err: Error) =>
      log(err, event.request).then(
        () => new Response(err.name, { status: 500 }),
      ),
    ),
  )
})

export type Router = (request: Request) => Promise<Response>

interface PathDict {
  [key: string]: Router
}

export function bind<A, B, C>(
  f: (r: A) => Promise<B>,
  g: (r: B) => Promise<C>,
): (r: A) => Promise<C> {
  return (a) => f(a).then(g)
}

export function pure(err: string, status: number = 200): Router {
  return async () => new Response(err, { status })
}

export function ruta(routes: PathDict): Router {
  return async (request: Request) => {
    const url = new URL(request.url)
    const encontrada = Object.entries(routes).find(([key, _]) =>
      url.pathname.startsWith(key),
    )
    const router = encontrada ? encontrada[1] : pure('ruta no encontrada', 404)
    return router(request)
  }
}

export function pre(
  validar: (r: Request) => Promise<void>,
  inner: Router,
): Router {
  return async (request: Request) => {
    try {
      await validar(request)
      return inner(request)
    } catch (err) {
      return pure('prequisitos no correctos: ' + err.message, 400)(request)
    }
  }
}

export type Router = (request: Request, pos: number) => Promise<Response>

interface PathDict {
  [key: string]: Router
}

export function bind<A, B, C>(
  f: (r: A, p: number) => Promise<B>,
  g: (r: B, p: number) => Promise<C>,
): (r: A, p: number) => Promise<C> {
  return (a, p) => f(a, p).then(y => g(y, p))
}

export function pure(err: string, status: number = 200): Router {
  return async () => new Response(err, { status })
}

export function ruta(routes: PathDict): Router {
  return async (request: Request, pos: number) => {
    const url = new URL(request.url)
    const encontrada = Object.entries(routes).find(([key, _]) =>
      url.pathname.slice(pos).startsWith(key),
    )
    const router = encontrada ? encontrada[1] : pure('ruta no encontrada', 404)
    return router(request, encontrada ? pos + encontrada[0].length : -1)
  }
}

export function pre(
  validar: (r: Request) => Promise<void>,
  inner: Router,
): Router {
  return async (request: Request, pos: number) => {
    try {
      await validar(request)
      return inner(request, pos)
    } catch (err) {
      return pure('prequisitos no correctos: ' + err.message, 400)(request, pos)
    }
  }
}

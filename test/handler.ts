import { expect } from 'chai'
import { handleRequest } from '../src/handler'
import { testEnv } from './env'

https://www.npmjs.com/package/mocha-headless-chrome


describe('#handleRequest', () => {
  it('no encuentra rutas que no existan', async () => {
    const r = await handleRequest(testEnv(), new Request('/asdasd'))

    expect(r.status).to.equal(404)
    expect(await r.text()).to.equal('ruta no encontrada')
  })

  describe('Slack', () => {
    describe('interacciones', () => {
      it('falla si no tiene payload', async () => {
        const r = await handleRequest(testEnv(), new Request('/slack/interactive', { body: 'Foo' }))

        expect(r.status).to.equal(400)
      })

    })
  })
})

import { expect } from 'chai'
import { handleRequest } from '../src/handler'
import { Slack } from '../src/slack'
import { RecursivePartial } from '../src/types'
import { testEnv } from './env'
import { FetchMock, KVMock, RequestMock as Request } from './mocks'
import { fixture } from './utils'

describe('#handleRequest', () => {
  it('no encuentra rutas que no existan', async () => {
    const r = await handleRequest(testEnv(), new Request('/asdasd'))

    expect(r.status).to.equal(404)
    expect(await r.text()).to.equal('ruta no encontrada')
  })

  describe('Slack', () => {
    describe('firmas', () => {
      it('si está configurado, valida la firma', async () => {
        const r = await handleRequest(
          testEnv({ slack: { verifySign: true } }),
          new Request('/slack/interactive'),
        )

        expect(r.status).to.equal(400)
        expect(await r.text()).to.equal(
          'prequisitos no correctos: No había firma de Slack.',
        )
      })

      it('si está configurado, valida la firma', async () => {
        const r = await handleRequest(
          testEnv({ slack: { verifySign: true } }),
          new Request('/slack/interactive', {
            headers: { 'x-slack-signature': 'foo' },
          }),
        )

        expect(r.status).to.equal(401)
        expect(await r.text()).to.equal(
          'prequisitos no correctos: Verificación fallida.',
        )
      })
    })

    describe('interacciones', () => {
      it('falla si no tiene payload', () => {
        return expect(
          handleRequest(
            testEnv(),
            new Request('/slack/interactive', { body: {} }),
          ),
        ).to.be.rejectedWith(Error, 'No había `payload` en el pedido')
      })

      it('foo', async () => {
        const kv = new KVMock({ foo: {} })

        const payload: RecursivePartial<Slack.InteractivePayload> = {
          type: 'block_actions',
          actions: [
            {
              action_id: 'completar',
              value: 'foo',
            },
          ],
        }

        const fetches = new FetchMock([null, req => {
          expect(req).to.be.eq("https://slack.com/api/chat.postMessage")
        }], [Promise.resolve(new Response(JSON.stringify({
          records: []
        }))), Promise.resolve(new Response(JSON.stringify({ ts: "100", channel: "fooo" })))]);

        await handleRequest(
          testEnv({ io: { kv, fetch: fetches.fetch() } }),
          new Request('/slack/interactive', {
            body: { payload: JSON.stringify(payload) },
          }),
        )

        expect(fetches.verify()).to.be.true
      })

      it.skip('fixture', async () => {
        const body = fixture('slack_interactive.txt')

        await handleRequest(
          testEnv(),
          new Request('/slack/interactive', { body }),
        )
      })
    })
  })
})

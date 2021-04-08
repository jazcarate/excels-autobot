import { expect } from 'chai'
import { verificar } from '../src/slack'
import { testEnv } from './env'

describe('Verificación de firmas de Slack', () => {
  it('Falla si no había firma de Slack', () => {
    return expect(
      verificar(testEnv({ slack: { verifySign: true } }), new Request('/')),
    ).to.be.rejectedWith(Error, 'No había firma de Slack.')
  })

  it('Falla si no se correlaciona la firma, timestamp y cuerpo', () => {
    return expect(
      verificar(
        testEnv({ slack: { verifySign: true, signSecret: 'una-firma' } }),
        new Request('/', {
          body: 'foo',
          headers: {
            'x-slack-signature': 'foo',
            'x-slack-request-timestamp': '123123123',
          },
        }),
      ),
    ).to.be.rejectedWith(Error, 'Verificación fallida.')
  })

  it('Resuelve correctamente si la firma es apropiada', () => {
    return expect(
      verificar(
        testEnv({ slack: { verifySign: true, signSecret: 'una-firma' } }),
        new Request('/', {
          body: 'foo',
          headers: {
            'x-slack-signature':
              'v0=8b55e7ad5e50b3d1cbfc4c235b83679baf10ad0b02bdf5f353e7e6a0003fe88d',
            'x-slack-request-timestamp': '123123123',
          },
        }),
      ),
    ).to.be.fulfilled
  })

  it('Resuelve correctamente si la firma esta mal, pero está configurado para saltear la verificación', () => {
    return expect(
      verificar(
        testEnv({ slack: { verifySign: false } }),
        new Request('/', {
          body: 'foo',
          headers: {
            'x-slack-signature': 'foo',
            'x-slack-request-timestamp': '123123123',
          },
        }),
      ),
    ).to.be.fulfilled
  })
})

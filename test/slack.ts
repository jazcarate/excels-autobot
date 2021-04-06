import { expect } from 'chai'
import { verificar } from '../src/slack'
import { testEnv } from './utils'

describe('Verificación de firmas de Slack', () => {
  it('Falla si no había firma de Slack', async () => {
    try {
      await verificar(testEnv(), new Request('/'))
    } catch (error) {
      expect(error).to.equal('No había firma de Slack.')
    }
  })

  it('Falla si no se correlaciona la firma, timestamp y cuerpo', async () => {
    try {
      await verificar(
        testEnv({ slack: { signSecret: 'una-firma' } }),
        new Request('/', {
          body: 'foo',
          headers: {
            'x-slack-signature': 'foo',
            'x-slack-request-timestamp': '123123123',
          },
        }),
      )
    } catch (error) {
      expect(error).to.equal('Verificación fallida.')
    }
  })

  it('Resuelve correctamente si la firma es apropiada', async () => {
    try {
      await verificar(
        testEnv({ slack: { signSecret: 'una-firma' } }),
        new Request('/', {
          body: 'foo',
          headers: {
            'x-slack-signature':
              'v0=8b55e7ad5e50b3d1cbfc4c235b83679baf10ad0b02bdf5f353e7e6a0003fe88d',
            'x-slack-request-timestamp': '123123123',
          },
        }),
      )
    } catch (error) {
      expect.fail('no debería haber arojado.')
    }
  })
})

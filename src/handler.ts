import { log } from './sentry'
import airtable, { AirTableRecord } from './airtable'
import { Env, User } from './types'
import {
  chatDelete,
  chatSend,
  openModal,
  publishHome,
  Slack,
  verificar,
} from './slack'
import env from './env'
import { pre, Router, ruta } from './routers'

declare const USERS_KV: KVNamespace

export async function handleRequest(request: Request): Promise<Response> {
  const r = ruta({
    '/slack': pre(
      (r) => verificar(env, r),
      ruta({
        '/slack/interactive': slackInteractive(env),
        '/slack/options-load': slackOptionsLoad(),
        '/slack/actions': slackActions(),
      }),
    ),
  })

  return r(request)
}

function slackInteractive(env: Env): Router {
  return async (request: Request) => {
    const data = await request.formData()
    const payload = data.get('payload')

    if (!isString(payload)) throw new Error('No payload in the response.')
    const j = JSON.parse(payload) // https://api.slack.com/reference/interaction-payloads/block-actions

    if (j.type == 'block_actions') {
      if (j.actions[0].action_id === 'list_airtable_colabs') {
        await USERS_KV.put(j.user.id, j.actions[0].selected_option.value)
      } else if (j.actions[0].action_id === 'desvincular') {
        await USERS_KV.delete(j.actions[0].value)
      } else if (j.actions[0].action_id === 'completar') {
        await sendValues(j.actions[0].value)
      } else if (j.actions[0].action_id === 'abrir_notas') {
        const semana = j.actions[0].block_id.slice(
          'semana:'.length,
          'semana:'.length + 6,
        )

        const slackUser = j.user.id
        const user: User | null = await USERS_KV.get(slackUser, 'json')
        if (!user) throw new Error('[Abrir notas] No había usuario en el KV')
        const row = await airtable.find(user, semana)

        await openModal(env, j.trigger_id, 'Notas', [
          {
            type: 'input',
            block_id: `semana:${semana}:Notes`,
            label: {
              type: 'plain_text',
              text: 'Escribir notas',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'accion_notas',
              min_length: 0,
              multiline: true,
              initial_value: row ? row.fields.Notes : undefined,
            },
          },
        ])
      } else if (j.actions[0].action_id === 'elejir') {
        const semana = Object.keys(j.state.values)[0].slice(
          'semana:'.length,
          'semana:'.length + 6,
        )
        const valores = Object.fromEntries(
          Object.entries(j.state.values)
            .map(([val, x]: any) => [
              val.slice('semana:'.length + 6 + 1),
              x.elejir.selected_option,
            ])
            .filter(([, x]) => x)
            .map(([val, x]: any) => [val, x.value]),
        )

        const user: User | null = await USERS_KV.get(j.user.id, 'json')
        if (!user) {
          throw new Error('[Elijiendo] No había usuario?!')
        }
        await airtable.patch(user, semana, valores)
      }
    } else if (j.type == 'view_submission') {
      const nuevaNota: string =
        j.view.state.values[j.view.blocks[0].block_id].accion_notas.value

      const semana = j.view.blocks[0].block_id.slice(
        'semana:'.length,
        'semana:'.length + 6,
      )

      const user: User | null = await USERS_KV.get(j.user.id, 'json')
      if (!user) {
        throw new Error('[Elijiendo (moda)] No había usuario?!')
      }

      await airtable.patch(user, semana, { Notes: nuevaNota })
    }

    if (j.view && j.view.type == 'home') {
      await refreshHome(j.user.id, request)
    }

    return new Response()
  }
}

function slackActions(): Router {
  return async (request: Request) => {
    const data = await request.json()

    if (data.type == 'url_verification') {
      return new Response(data.challenge)
    } else if (data.event.type == 'app_home_opened') {
      const slackUser = data.event.user
      await refreshHome(slackUser, request)
      return new Response()
    } else {
      throw new Error(`can't recognize ${data.type}`)
    }
  }
}

function slackOptionsLoad(): Router {
  return async (request: Request) => {
    const data = await request.formData()
    const payload = data.get('payload')

    if (!isString(payload)) throw new Error('No payload in the response.')
    const j = JSON.parse(payload)

    if (j.action_id !== 'list_airtable_colabs') {
      throw new Error('No idea why it got selected')
    }

    const colalborators = await airtable.collaborators()

    const found = colalborators.filter(
      ({ name }) =>
        name
          .toLocaleLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .indexOf(
            j.value
              .toLocaleLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, ''),
          ) !== -1,
    )

    return new Response(
      JSON.stringify({
        options: found.map((employee) => {
          const value: User = {
            airtableId: employee.id,
            airtableName: employee.name,
          }
          return {
            text: {
              type: 'plain_text',
              text: employee.name,
            },
            value: JSON.stringify(value),
          }
        }),
      }),
      { headers: { 'Content-Type': 'application/json;charset=UTF-8' } },
    )
  }
}

function opcion(
  nombre: 'Performance' | 'Team' | 'Environment' | 'Growth',
  last: AirTableRecord | null,
  rango = 4,
): Slack.Block {
  const semana = airtable.week(new Date())
  const current = last && last.Week.toString() === semana

  return {
    type: 'section',
    block_id: `semana:${semana}:${nombre}`,
    text: {
      type: 'mrkdwn',
      text: nombre + ':',
    },
    accessory: {
      action_id: 'elejir',
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text:
          last && last[nombre] && !current
            ? `La semana pasada fue ${last[nombre]}`
            : `[1-${rango}]`,
      },
      initial_option:
        current && last && last[nombre]
          ? {
              text: {
                type: 'plain_text',
                text: last[nombre],
              },
              value: last[nombre],
            }
          : undefined,
      options: [...Array(rango).keys()]
        .map((i) => (i + 1).toString())
        .map((i) => ({
          text: {
            type: 'plain_text',
            text: i,
          },
          value: i,
        })),
    },
  }
}

async function sendValues(slackUser: string): Promise<void> {
  const semana = airtable.week(new Date())
  const user: User | null = await USERS_KV.get(slackUser, 'json')
  if (!user) throw new Error('[sendValues] No había usuario en el KV')
  const last = await airtable.lastRowOf(user)

  const blocks: Slack.Block[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `En la semana *${semana}*, como puntuarías:`,
      },
    },
    opcion('Performance', last),
    opcion('Team', last),
    opcion('Environment', last),
    opcion('Growth', last, 3),
    {
      type: 'section',
      block_id: `semana:${airtable.week(new Date())}:Notes`,
      text: {
        type: 'mrkdwn',
        text: 'Notas:',
      },
      accessory: {
        action_id: 'abrir_notas',
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Escribir notas',
        },
        style: 'primary',
        value: last ? last.Notes : '',
      },
    },
  ]

  if (user.lastMessage && isSoonEnoughToDelete(user.lastMessage.ts))
    await chatDelete(env, user.lastMessage)
  const r = await chatSend(env, slackUser, blocks)
  const { ts, channel } = await r.json()

  user.lastMessage = { ts, channel }
  await USERS_KV.put(slackUser, JSON.stringify(user))
}

async function refreshHome(slackUser: string, request: Request): Promise<void> {
  const blocks: Slack.Block[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Excels desde la comodidad de Slack',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'Tradicionalmente, cada viernes tenemos una reunión dónde compartimos las últimas novedades, actualizaciones de los proyectos de los clientes, la satisfacción de ellos, el desarrollo de las personas, etc.\n' +
          'Para hacer un seguimiento personal de cada uno, completamos en una tabla la puntuación de distintos ejes.\n' +
          '👇 Aquí puedes ver la información más reciente en la planilla, y pedirme que te envíe un mensaje para completar o actualizar tus valoraciones.\n' +
          '_Por cualquier consulta/queja/recomendación, puedes contactar a mi creador <@U01QSTJ1VTR>._',
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '<https://airtable.com/tblGvMhtrmqeAqkiD/viwrgU7D4QeJLyWae?blocks=hide|Ir directamente a AirTable>',
      },
    },
  ]

  const announcement = await USERS_KV.get('announcement', 'text')
  if (announcement) {
    blocks.unshift(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Announcement*: ${announcement}`,
        },
      },
      {
        type: 'divider',
      },
    )
  }

  const user = await USERS_KV.get<User>(slackUser, 'json')
  if (!user) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'No sé quien eres en `AirTable`',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'external_select',
            action_id: 'list_airtable_colabs',
            placeholder: {
              type: 'plain_text',
              text: 'Gente en AirTable',
            },
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text:
              'La lista es generada según la última semana en AirTable. Si no aparaces, tendrás que cargarlo a mano y volver la proxima semana.',
          },
        ],
      },
    )

    return publishHome(env, slackUser, blocks)
  }

  const loading = publishHome(env, slackUser, [
    ...blocks,
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Cargando datos de AirTable...',
      },
    },
  ])

  const last = await airtable.lastRowOf(user)

  if (!last) {
    log(
      new Error(
        'No hay una fila en AirTable para el usuario: ' + JSON.stringify(user),
      ),
      request,
    )

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'No parece que tengas ninguna fila.',
      },
    })

    await loading
    await publishHome(env, slackUser, blocks)
    return
  } else {
    if (last.Week.toString() === airtable.week(new Date())) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:white_check_mark: Tienes una fila esta semana con:`,
        },
      })
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Todavía no tienes una fila para esta semana.*',
        },
      })
    }

    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `La última fila (semana: *${last.Week}*) en AirTable`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Performance*:\n${last.Performance || '`<nada>`'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Team*:\n${last.Team || '`<nada>`'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Environment*:\n${last.Environment || '`<nada>`'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Growth*:\n${last.Growth || '`<nada>`'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Notes*:\n${last.Notes || '`<nada>`'}`,
          },
        ],
      },
    )

    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: 'completar',
          text: {
            type: 'plain_text',
            text: 'Completar esta semana',
          },
          style: 'primary',
          value: `${slackUser}`,
        },
        {
          type: 'button',
          action_id: 'desvincular',
          text: {
            type: 'plain_text',
            text: 'Desvincular',
          },
          style: 'danger',
          value: `${slackUser}`,
        },
      ],
    })

    await loading
    await publishHome(env, slackUser, blocks)
    return
  }
}

function isString(x: any): x is string {
  return typeof x === 'string' || x instanceof String
}

const ONE_WEEK_TS = 7 * 24 * 60 * 60 * 1000
function isSoonEnoughToDelete(ts: string) {
  return parseFloat(ts) * 1000 + ONE_WEEK_TS > Date.now()
}

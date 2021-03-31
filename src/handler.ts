import { log } from './sentry'
import airtable, { AirTableRecord } from './airtable'
import { User } from './types'
import slack, { Slack } from './slack'

declare const USERS_KV: KVNamespace

export async function handleRequest(request: Request): Promise<Response> {
  if (isInteractiveCallback(request)) {
    const data = await request.formData()
    const payload = data.get('payload')

    if (!isString(payload)) {
      throw new Error('No payload in the response.')
    }
    const j = JSON.parse(payload)

    if (j.type == 'block_actions') {
      if (j.actions[0].action_id === 'list_airtable_colabs') {
        await USERS_KV.put(j.user.id, j.actions[0].selected_option.value)
      } else if (j.actions[0].action_id === 'desvincular') {
        console.log('Borrando ', j.actions[0].value)
        await USERS_KV.delete(j.actions[0].value)
      } else if (j.actions[0].action_id === 'completar') {
        return sendValues(j.actions[0].value, request)
      } else if (j.actions[0].action_id === 'abrir_notas') {
        const semana = j.actions[0].block_id.slice(
          'semana:'.length,
          'semana:'.length + 6,
        )

        return slack.openModal(j.trigger_id, 'Notas', [
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
              // initial_value: j.actions[0].value, TODO
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
        return new Response()
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
      return publishHome(j.user.id, request)
    }
  } else if (isEvents(request)) {
    const data = await request.json()

    if (data.type == 'url_verification') {
      return new Response(data.challenge)
    } else if (data.event.type == 'app_home_opened') {
      const slackUser = data.event.user
      return publishHome(slackUser, request)
    } else {
      throw new Error(`can't recognize ${data.type}`)
    }
  } else if (isOptionsLoad(request)) {
    const data = await request.formData()
    const payload = data.get('payload')

    if (!isString(payload)) {
      throw new Error('No payload in the response.')
    }
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

  return new Response()
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
      options: [...Array(rango).keys()].map((i) => ({
        text: {
          type: 'plain_text',
          text: i.toString(),
        },
        value: i.toString(),
      })),
    },
  }
}

async function sendValues(
  slackUser: string,
  request: Request,
): Promise<Response> {
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

  await slack.postMessage(slackUser, blocks)
  return new Response()
}

async function publishHome(
  slackUser: string,
  request: Request,
): Promise<Response> {
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
          'TODO intrucciónes :stuck_out_tongue:\n<https://airtable.com/tblGvMhtrmqeAqkiD/viwrgU7D4QeJLyWae?blocks=hide|Ir directamente a AirTable>',
      },
    },
    { type: 'divider' },
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

    await slack.publishHome(slackUser, blocks)
    return new Response()
  }

  const loading = slack.publishHome(slackUser, [
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
    await slack.publishHome(slackUser, blocks)
    return new Response()
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
          text: 'La última fila en AirTable',
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Performance*:\n${last.Performance}`,
          },
          {
            type: 'mrkdwn',
            text: `*Team*:\n${last.Team}`,
          },
          {
            type: 'mrkdwn',
            text: `*Environment*:\n${last.Environment}`,
          },
          {
            type: 'mrkdwn',
            text: `*Growth*:\n${last.Growth}`,
          },
          {
            type: 'mrkdwn',
            text: `*Notes*:\n${last.Notes}`,
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
    await slack.publishHome(slackUser, blocks)
    return new Response()
  }
}

function isInteractiveCallback(request: Request) {
  return new URL(request.url).pathname == '/slack/interactive'
}

function isEvents(request: Request) {
  return new URL(request.url).pathname == '/slack/actions'
}

function isOptionsLoad(request: Request) {
  return new URL(request.url).pathname == '/slack/options-load'
}

function isString(x: any): x is string {
  return typeof x === 'string' || x instanceof String
}

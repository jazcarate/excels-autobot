import { createHmac } from 'crypto'
import { Env, LastMessage } from './types'

export async function verificar(env: Env, request: Request): Promise<void> {
  const slackSignature = request.headers.get('x-slack-signature')

  if (!slackSignature) throw 'No había firma de Slack.'

  const body = await request.clone().text()
  const timestamp = request.headers.get('x-slack-request-timestamp')

  const sigBasestring = 'v0:' + timestamp + ':' + body
  let mySignature =
    'v0=' +
    createHmac('sha256', env.slack.signSecret)
      .update(sigBasestring, 'utf8')
      .digest('hex')

  if (mySignature !== slackSignature) throw 'Verificación fallida.'
}

export async function publishHome(
  env: Env,
  userId: string,
  blocks: Slack.Block[],
): Promise<void> {
  const res = await fetch('https://slack.com/api/views.publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: `Bearer ${env.slack.token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      view: {
        type: 'home',
        blocks,
      },
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(t)
  } else {
    return
  }
}

export async function chatSend(
  env: Env,
  userId: string,
  blocks: Slack.Block[],
): Promise<Response> {
  const res = await fetch('https://slack.com/api/chat.chatSend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: `Bearer ${env.slack.token}`,
    },
    body: JSON.stringify({
      channel: userId,
      blocks,
    }),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(t)
  } else {
    return res
  }
}

export async function chatDelete(
  env: Env,
  { ts, channel }: LastMessage,
): Promise<void> {
  const res = await fetch('https://slack.com/api/chat.delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: `Bearer ${env.slack.token}`,
    },
    body: JSON.stringify({ channel, ts }),
  })

  const body = await res.json() // Refactor los otros reqeusts a slack como este
  if (!res.ok || !body.ok) {
    throw new Error(body)
  }
}

export async function openModal(
  env: Env,
  triggerId: string,
  titulo: string,
  blocks: Slack.Block[],
): Promise<void> {
  const body = JSON.stringify({
    trigger_id: triggerId,
    view: {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: titulo,
      },
      submit: {
        type: 'plain_text',
        text: 'Guardar',
      },
      blocks,
    },
  })

  const res = await fetch('https://slack.com/api/views.open', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: `Bearer ${env.slack.token}`,
    },
    body,
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(t)
  } else {
    return
  }
}

export namespace Slack {
  export namespace BlockType {
    export type Header = {
      type: 'header'
      text: {
        type: 'plain_text'
        text: string
      }
    }

    export type SectionText = {
      type: 'section'
      text: {
        type: 'mrkdwn'
        text: string
      }
      accessory?: ActionElement
    }

    export type SectionFields = {
      type: 'section'
      fields: {
        type: 'mrkdwn'
        text: string
      }[]
    }

    export type Section = SectionText | SectionFields

    export type Context = {
      type: 'context'
      elements: [
        {
          type: 'mrkdwn'
          text: string
        },
      ]
    }

    export type Divider = {
      type: 'divider'
    }

    export type Input = {
      type: 'input'
      block_id?: string
      label: {
        type: 'plain_text'
        text: string
      }
      element: {
        type: 'plain_text_input'
        action_id?: string
        multiline?: boolean
        initial_value?: string
        min_length?: number
      }
    }

    export type Action = {
      type: 'actions'
      elements: ActionElement[]
    }
    type ActionElement =
      | ButtonAction
      | ExternalSelectAction
      | StaticSelectAction

    type StaticSelectAction = {
      type: 'static_select'
      action_id: string
      placeholder: {
        type: 'plain_text'
        text: string
      }
      initial_option?: Option
      options: Option[]
    }

    type Option = {
      text: {
        type: 'plain_text'
        text: string
      }
      value: string
    }

    type ButtonAction = {
      type: 'button'
      action_id: string
      text: {
        type: 'plain_text'
        text: string
      }
      style: 'danger' | 'primary'
      value: string
    }

    type ExternalSelectAction = {
      type: 'external_select'
      action_id: string
      placeholder: {
        type: 'plain_text'
        text: string
      }
    }
  }

  export type Block =
    | BlockType.Header
    | BlockType.Section
    | BlockType.Divider
    | BlockType.Action
    | BlockType.Context
    | BlockType.Input

  // https://api.slack.com/reference/interaction-payloads/block-actions
  export type InteractivePayload = {
    type: 'block_actions'
    user: {
      id: string
    }
    view?: {
      type: 'home'
    }
    trigger_id: string
    actions: [
      {
        block_id: string
        action_id: string
        selected_option: {
          value: string
        }
        value: string
      },
    ]
    state: {
      values: string[]
    }
  }

  // https://api.slack.com/apis/connections/events-api#receiving_events
  export type ActionsPayload =
    | {
      type: 'url_verification'
      challenge: string
    }
    | {
      type: 'event_callback'
      event: {
        type: 'app_home_opened'
        user: string
      }
    }

  export type OptionsPayload = {
    action_id: 'list_airtable_colabs'
    value: string
  }
}

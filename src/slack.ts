import env from './env'

async function publishHome(userId: string, blocks: Slack.Block[]) {
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
    return res
  }
}

async function postMessage(
  userId: string,
  blocks: Slack.Block[],
): Promise<Response> {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
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

async function openModal(
  triggerId: string,
  titulo: string,
  blocks: Slack.Block[],
) {
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
    return res
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
}

export default { publishHome, postMessage, openModal }

export interface User {
  airtableId: string
  airtableName: string
  lastMessage?: LastMessage
}

export type LastMessage = {
  ts: string
  channel: string
}

export type Env = {
  repo: {
    comithash: string
  }
  environment?: string
  slack: {
    token: string
    signSecret: string
  }
  airTable: {
    key: string
  }
  sentry: {
    projectId: string
    key: string
  }
}

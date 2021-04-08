export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

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
    verifySign: boolean
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
  io: {
    fetch: Fetch
    kv: KVNamespace
    now: Now
  }
}

export type Fetch = (
  input: RequestInfo,
  init?: RequestInit,
) => Promise<Response>
export type Now = () => Date

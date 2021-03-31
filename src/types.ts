export interface User {
  airtableId: string
  airtableName: string
  lastMessage?: LastMessage
}

export type LastMessage = {
  ts: string
  channel: string
}

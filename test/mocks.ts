export class KVMock implements KVNamespace {
  db: any

  constructor(db?: any) {
    this.db = db || {}
  }

  get(key: string): KVValue<string>
  get(key: string, type: 'text'): KVValue<string>
  get<ExpectedValue = unknown>(
    key: string,
    type: 'json',
  ): KVValue<ExpectedValue>
  get(key: string, type: 'arrayBuffer'): KVValue<ArrayBuffer>
  get(key: string, type: 'stream'): KVValue<ReadableStream<any>>
  get(key: any, type?: any): KVValue<any> {
    return Promise.resolve(this.db[key])
  }
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream<any> | FormData,
    options?: { expiration?: string | number; expirationTtl?: string | number },
  ): Promise<void> {
    this.db[key] = value
    return Promise.resolve()
  }
  delete(key: string): Promise<void> {
    delete this.db[key]
    return Promise.resolve()
  }
  list(options?: {
    prefix?: string
    limit?: number
    cursor?: string
  }): Promise<{
    keys: { name: string; expiration?: number }[]
    list_complete: boolean
    cursor: string
  }> {
    throw new Error('Method not implemented.')
  }
}

export class FormDataMock implements FormData {
  data: any

  constructor(data: any) {
    this.data = data
  }

  append(name: string, value: string | Blob, fileName?: string): void {
    throw new Error('Method not implemented.')
  }
  delete(name: string): void {
    throw new Error('Method not implemented.')
  }
  get(name: string): FormDataEntryValue {
    const ret = this.data[name]
    if (typeof ret !== 'string') console.warn('Form data was not string')
    return ret
  }
  getAll(name: string): FormDataEntryValue[] {
    throw new Error('Method not implemented.')
  }
  has(name: string): boolean {
    throw new Error('Method not implemented.')
  }
  set(name: string, value: string | Blob, fileName?: string): void {
    throw new Error('Method not implemented.')
  }
  forEach(
    callbackfn: (
      value: FormDataEntryValue,
      key: string,
      parent: FormData,
    ) => void,
    thisArg?: any,
  ): void {
    throw new Error('Method not implemented.')
  }
  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
    throw new Error('Method not implemented.')
  }
  entries(): IterableIterator<[string, FormDataEntryValue]> {
    throw new Error('Method not implemented.')
  }
  keys(): IterableIterator<string> {
    throw new Error('Method not implemented.')
  }
  values(): IterableIterator<FormDataEntryValue> {
    throw new Error('Method not implemented.')
  }
}

interface HeadersData {
  [key: string]: string
}

export class MockHeaders implements Headers {
  data: HeadersData

  constructor(data: HeadersData) {
    this.data = data
  }

  append(name: string, value: string): void {
    throw new Error('Method not implemented.')
  }
  delete(name: string): void {
    throw new Error('Method not implemented.')
  }
  get(name: string): string {
    return this.data[name]
  }
  has(name: string): boolean {
    throw new Error('Method not implemented.')
  }
  set(name: string, value: string): void {
    throw new Error('Method not implemented.')
  }
  forEach(
    callbackfn: (value: string, key: string, parent: Headers) => void,
    thisArg?: any,
  ): void {
    throw new Error('Method not implemented.')
  }
  [Symbol.iterator](): IterableIterator<[string, string]> {
    throw new Error('Method not implemented.')
  }
  entries(): IterableIterator<[string, string]> {
    throw new Error('Method not implemented.')
  }
  keys(): IterableIterator<string> {
    throw new Error('Method not implemented.')
  }
  values(): IterableIterator<string> {
    throw new Error('Method not implemented.')
  }
}

type RequestInit = {
  body?: any
  headers?: HeadersData
  type?: 'formData' | 'json'
}

export class RequestMock implements Request {
  type: string
  mockBody: any

  constructor(url: string, init?: RequestInit) {
    const { body, headers, type } = init || {}
    this.url = 'http://example.com' + url
    this.mockBody = body
    this.headers = new MockHeaders(headers || {})
    this.type = type || 'formData'
    this.bodyUsed = false
  }

  cache: RequestCache
  credentials: RequestCredentials
  destination: RequestDestination
  headers: Headers
  integrity: string
  isHistoryNavigation: boolean
  isReloadNavigation: boolean
  keepalive: boolean
  method: string
  mode: RequestMode
  redirect: RequestRedirect
  referrer: string
  referrerPolicy: ReferrerPolicy
  signal: AbortSignal
  url: string
  clone(): Request {
    this.bodyUsed = false
    return this
  }
  cf: IncomingRequestCfProperties
  body: ReadableStream<Uint8Array>
  bodyUsed: boolean
  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented.')
  }
  blob(): Promise<Blob> {
    throw new Error('Method not implemented.')
  }
  formData(): Promise<FormData> {
    if (this.type !== 'formData')
      console.warn('Body was not formData, it was ' + this.type)
    if (this.bodyUsed) throw new Error('Body already used')
    this.bodyUsed = true
    return Promise.resolve(new FormDataMock(this.mockBody))
  }
  json(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  text(): Promise<string> {
    if (this.bodyUsed) throw new Error('Body already used')
    this.bodyUsed = true
    return Promise.resolve(JSON.stringify(this.mockBody))
  }
}

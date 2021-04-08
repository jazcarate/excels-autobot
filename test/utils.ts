import fs = require('fs')
var path = require('path')

export function fixture(file: string): any {
  const p = path.join(__dirname, '../..', 'test', 'fixture', file)
  const data = fs.readFileSync(p, 'utf8')

  if (file.endsWith('.txt')) {
    // form data
    return Object.fromEntries(new URLSearchParams(data))
  }
}

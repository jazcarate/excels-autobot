import { Env, User } from './types'

export interface AirTableRecord {
  Week: string
  Notes: string
  Employee: AirtableEmployee
  Performance: string
  Team: string
  Environment: string
  Growth: string
}

async function findOne(
  env: Env,
  formula: string,
): Promise<{ id: string; fields: AirTableRecord } | null> {
  const params = {
    maxRecords: '1',
    view: 'Weekly',
    filterByFormula: formula,
    'sort[0][field]': 'Week',
    'sort[0][direction]': 'desc',
  }

  const res = await env.io.fetch(
    'https://api.airtable.com/v0/apphmB5Cd6nvW66av/People%20Development?' +
    new URLSearchParams(params),
    {
      headers: {
        Authorization: `Bearer ${env.airTable.key}`,
      },
    },
  )

  if (!res.ok) {
    const t = await res.text()
    throw new Error('[AirTable] Fallo en obtener la última fila porque: ' + t)
  }

  const data = await res.json()

  if (data.records.length == 0) {
    return null
  }

  return data.records[0]
}

async function lastRowOf(env: Env, user: User): Promise<AirTableRecord | null> {
  const x = await findOne(env, `Employee='${user.airtableName}'`)
  return x ? x.fields : null
}

const LAST_WEEK_TIME = 7 * 24 * 60 * 60 * 1000

interface AirtableEmployee {
  id: string
  email: string
  name: string
}

async function collaborators(env: Env): Promise<AirtableEmployee[]> {
  const params = {
    view: 'Weekly',
    'fields[]': 'Employee',
    'sort[0][field]': 'Week',
    'sort[0][direction]': 'desc',
  }
  const res = await env.io.fetch(
    'https://api.airtable.com/v0/apphmB5Cd6nvW66av/People%20Development?' +
    new URLSearchParams(params),
    {
      headers: {
        Authorization: `Bearer ${env.airTable.key}`,
      },
    },
  )

  if (!res.ok) {
    const t = await res.text()
    throw new Error('[Airtable] No pude obtener: ' + t)
  }

  const data = await res.json()

  return data.records
    .map(({ fields }: any) => fields.Employee)
    .filter((x: any) => x)
    .filter((x: AirtableEmployee, i: number, a: AirtableEmployee[]) => a.findIndex(y => x.id === y.id) == i);
}

function week(date: Date): string {
  const onejan = new Date(date.getFullYear(), 0, 1)
  const weknumber = Math.ceil(
    ((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7,
  )

  return `${date.getFullYear()}${weknumber}`
}

async function find(env: Env, user: User, week: string) {
  return findOne(env, `AND(Employee='${user.airtableName}', Week=${week})`)
}

async function patch(
  env: Env,
  user: User,
  week: string,
  rec: Partial<AirTableRecord>,
): Promise<void> {
  const prev = await find(env, user, week)
  var res
  if (prev) {
    res = await env.io.fetch(
      'https://api.airtable.com/v0/apphmB5Cd6nvW66av/People%20Development',
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${env.airTable.key}`,
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          records: [
            {
              id: prev.id,
              fields: rec,
            },
          ],
        }),
      },
    )
  } else {
    res = await env.io.fetch(
      'https://api.airtable.com/v0/apphmB5Cd6nvW66av/People%20Development',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.airTable.key}`,
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                ...rec,
                Week: parseInt(week),
                Employee: { id: user.airtableId },
              },
            },
          ],
        }),
      },
    )
  }

  if (!res.ok) {
    throw new Error(await res.text())
  }
}

export default { lastRowOf, find, collaborators, week, patch }

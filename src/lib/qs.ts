export type QueryValue =
  | string
  | number
  | boolean
  | Date
  | QueryValue[]
  | { [key: string]: QueryValue | null | undefined }
  | null
  | undefined

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function appendQuery(
  key: string,
  value: QueryValue | null | undefined,
  parts: string[]
) {
  if (value === null || value === undefined) {
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendQuery(`${key}[${index}]`, item, parts)
    })
    return
  }

  if (value instanceof Date) {
    parts.push(`${key}=${encodeURIComponent(value.toISOString())}`)
    return
  }

  if (isPlainObject(value)) {
    const entries = Object.keys(value).sort()
    for (const childKey of entries) {
      appendQuery(
        `${key}[${encodeURIComponent(childKey)}]`,
        value[childKey] as QueryValue,
        parts
      )
    }
    return
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    parts.push(`${key}=${encodeURIComponent(String(value))}`)
  }
}

export function qs(params: Record<string, any>): string {
  const parts: string[] = []
  const entries = Object.keys(params).sort()

  for (const key of entries) {
    appendQuery(encodeURIComponent(key), params[key] as QueryValue, parts)
  }

  if (parts.length === 0) {
    return ''
  }

  return `?${parts.join('&')}`
}
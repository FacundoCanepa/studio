import assert from 'node:assert/strict'

import {toStrapiSlug} from '../src/lib/strapiSlug'

const allowedPattern = /^[A-Za-z0-9\-_.~]+$/

const cases = [
  {
    input: 'armario cápsula',
    expected: 'armario-capsula',
  },
  {
    input: 'Moda & estilo!',
    expected: 'moda-estilo',
  },
  {
    input: '  Café   ~ Noche  ',
    expected: 'cafe-~-noche',
  },
]

cases.forEach(({input, expected}) => {
  const actual = toStrapiSlug(input)
  assert.equal(actual, expected, `Expected ${input} to become ${expected}, received ${actual}`)
  assert.ok(
    allowedPattern.test(actual),
    `Expected ${actual} to match ${allowedPattern.toString()}`
  )
})

const diacriticResult = toStrapiSlug('Última sesión de baño')
assert.equal(
  diacriticResult,
  'ultima-sesion-de-bano',
  `Expected diacritics to be stripped, received ${diacriticResult}`
)
assert.ok(
  allowedPattern.test(diacriticResult),
  `Expected ${diacriticResult} to match ${allowedPattern.toString()}`
)

console.log('All Strapi slug cases passed')
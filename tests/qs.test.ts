import assert from 'node:assert/strict'

import {qs} from '../src/lib/qs'

type Case = {
  readonly description: string
  readonly input: Record<string, unknown>
  readonly expected: string
}

const cases: Case[] = [
  {
    description: 'returns empty string for empty params',
    input: {},
    expected: '',
  },
  {
    description: 'serializes flat primitives',
    input: {page: 1, published: true, sort: 'title'},
    expected: '?page=1&published=true&sort=title',
  },
  {
    description: 'drops nullish values',
    input: {page: null, search: undefined, locale: 'en'},
    expected: '?locale=en',
  },
  {
    description: 'serializes arrays using numeric indexes',
    input: {fields: ['title', 'slug']},
    expected: '?fields[0]=title&fields[1]=slug',
  },
  {
    description: 'serializes nested populate object',
    input: {
      populate: {
        Cover: {
          fields: ['url'],
        },
      },
    },
    expected: '?populate[Cover][fields][0]=url',
  },
  {
    description: 'serializes pagination and filters',
    input: {
      pagination: {page: 2, pageSize: 20},
      filters: {
        status: {
          $eq: 'published',
        },
      },
    },
    expected:
      '?filters[status][%24eq]=published&pagination[page]=2&pagination[pageSize]=20',
  },
  {
    description: 'serializes nested arrays of objects',
    input: {
      populate: {
        blocks: [
          {
            fields: ['title'],
            populate: {media: {fields: ['url', 'name']}},
          },
        ],
      },
    },
    expected:
      '?populate[blocks][0][fields][0]=title&populate[blocks][0][populate][media][fields][0]=url&populate[blocks][0][populate][media][fields][1]=name',
  },
]

cases.forEach(testCase => {
  const actual = qs(testCase.input)
  assert.equal(
    actual,
    testCase.expected,
    `Expected ${testCase.description} to produce ${testCase.expected}, received ${actual}`
  )
})

console.log('All qs cases passed')
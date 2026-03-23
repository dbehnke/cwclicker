import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('App.vue responsive shell', () => {
  it('uses mobile-first spacing for the shell and keyer row', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')

    expect(source).toContain('min-h-screen px-4 sm:px-8')
    expect(source).toContain('flex flex-col md:flex-row gap-2 md:gap-4')
  })
})

import { execSync } from 'child_process'

function getVersion() {
  try {
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf-8' })
    const isDirty = status.trim().length > 0
    const dirtySuffix = isDirty ? '-dirty' : ''

    // Get the git describe output
    let describe
    try {
      describe = execSync('git describe --tags --long', { encoding: 'utf-8' }).trim()
    } catch {
      // If no tags exist, use v0.0.0 as base
      const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
      describe = `v0.0.0-0-g${sha}`
    }

    // Parse the describe output: v1.0.0-5-gabc123
    const match = describe.match(/^(.+)-(\d+)-g([a-f0-9]+)$/)

    if (match) {
      const [, tag, commits, sha] = match
      return `${tag}-${commits}-${sha}${dirtySuffix}`
    }

    return describe + dirtySuffix
  } catch (error) {
    console.error('Error generating version:', error)
    return 'v0.0.0-0-unknown'
  }
}

console.log(getVersion())

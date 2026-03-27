import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { configDefaults, defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

function getGitVersion() {
  try {
    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf-8' })
    const isDirty = status.trim().length > 0
    const dirtySuffix = isDirty ? '-dirty' : ''

    // Get number of commits from the VERSION file's base tag
    let commitsSinceTag = '0'
    let shortSha = 'unknown'

    try {
      // Get the short SHA
      shortSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()

      // Try to get commits since the tag matching the VERSION
      const baseVersion = readFileSync('./VERSION', 'utf-8').trim()
      const tagName = `v${baseVersion}`

      const hasTag = execSync(`git tag --list ${tagName}`, { encoding: 'utf-8' }).trim().length > 0

      if (hasTag) {
        const count = execSync(`git rev-list --count ${tagName}..HEAD`, {
          encoding: 'utf-8',
        }).trim()
        commitsSinceTag = count
      } else {
        // Tag doesn't exist yet, count all commits
        commitsSinceTag = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim()
      }
    } catch {
      // Git not available
    }

    return { commitsSinceTag, shortSha, dirtySuffix }
  } catch {
    return { commitsSinceTag: '0', shortSha: 'unknown', dirtySuffix: '' }
  }
}

function getFullVersion() {
  const baseVersion = readFileSync('./VERSION', 'utf-8').trim()
  const { commitsSinceTag, shortSha, dirtySuffix } = getGitVersion()
  return `v${baseVersion}-${commitsSinceTag}-${shortSha}${dirtySuffix}`
}

export default defineConfig({
  plugins: [vue()],
  base: '/cwclicker/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [...configDefaults.exclude, '.worktrees/**'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(getFullVersion()),
  },
})

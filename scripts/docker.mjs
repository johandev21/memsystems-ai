import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const [mode, action] = process.argv.slice(2)
const validModes = new Set(['dev', 'prod'])
const validActions = new Set(['up', 'down', 'logs', 'ps', 'migrate', 'reset'])

if (!validModes.has(mode) || !validActions.has(action)) {
  console.error('Usage: node scripts/docker.mjs <dev|prod> <up|down|logs|ps|migrate|reset>')
  process.exit(1)
}

const privateEnvPath = resolve(`.env.docker.${mode}`)
const exampleEnvPath = resolve(`.env.docker.${mode}.example`)
const envPath = existsSync(privateEnvPath) ? privateEnvPath : exampleEnvPath

if (mode === 'prod' && !existsSync(privateEnvPath)) {
  console.error('Missing .env.docker.prod.')
  console.error('Copy .env.docker.prod.example to .env.docker.prod and set the required secrets.')
  process.exit(1)
}

if (!existsSync(envPath)) {
  console.error(`Missing Docker environment file: ${envPath}`)
  process.exit(1)
}

function parseEnv(path) {
  const values = new Map()
  for (const sourceLine of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    const line = sourceLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }
    values.set(key, value)
  }
  return values
}

if (mode === 'prod') {
  const values = parseEnv(envPath)
  const required = ['APP_ORIGIN', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB']
  const secretKeys = ['BETTER_AUTH_SECRET', 'DEV_STORAGE_TOKEN_SECRET']
  const missing = required.filter((key) => !values.get(key))
  const weakSecrets = secretKeys.filter((key) => {
    const value = values.get(key) || ''
    return value.length < 32 || /change.?me|replace|example/iu.test(value)
  })

  if (missing.length || weakSecrets.length) {
    if (missing.length) console.error(`Missing production-like values: ${missing.join(', ')}`)
    if (weakSecrets.length) {
      console.error(`Secrets must be at least 32 characters and non-placeholder: ${weakSecrets.join(', ')}`)
    }
    process.exit(1)
  }

  try {
    new URL(values.get('APP_ORIGIN'))
  } catch {
    console.error('APP_ORIGIN must be a valid absolute URL.')
    process.exit(1)
  }
}

const composeArgs = ['compose', '--env-file', envPath, '-f', `compose.${mode}.yml`]
const actionCommands = {
  up: [
    mode === 'dev'
      ? ['up', '--build', '--remove-orphans']
      : ['up', '--build', '--detach', '--remove-orphans'],
  ],
  down: [['down', '--remove-orphans']],
  logs: [['logs', '--follow']],
  ps: [['ps']],
  migrate: [
    ['build', mode === 'dev' ? 'backend' : 'migrate'],
    ['run', '--rm', 'migrate'],
  ],
  reset: [['down', '--volumes', '--remove-orphans']],
}[action]

for (const actionArgs of actionCommands) {
  const result = spawnSync('docker', [...composeArgs, ...actionArgs], {
    stdio: 'inherit',
    shell: false,
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) process.exit(result.status ?? 1)
}

process.exit(0)

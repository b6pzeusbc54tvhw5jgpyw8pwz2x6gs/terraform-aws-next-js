import fs from 'fs'
import rimraf from 'rimraf'
import * as path from 'path'
import { runCommand } from './util'
import to from 'await-to-js'

const cwd = process.cwd()

const getEnvProduction = async () => {
  const [err,stdout] = await to(runCommand(`git describe`))
  return `
NEXT_PUBLIC_APP_REVISION=${stdout || 'No-git-tag'}
`
}

const run = async () => {
  const buildDir = path.join(cwd, '.next-tf')
  rimraf.sync(buildDir)

  const envProduction = await getEnvProduction()
  fs.writeFileSync(path.join(cwd, '.env.production'), envProduction)
  console.log('.env.production is created')
}

const startAsync = async () => {
  try {
    await run()
  } catch(err) {
    console.error(err)
    process.exit(1)
  }
}

if (require.main === module) {
  startAsync()
}

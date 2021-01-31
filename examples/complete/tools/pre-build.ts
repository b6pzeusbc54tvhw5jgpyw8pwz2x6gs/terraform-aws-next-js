import fs from 'fs'
import rimraf from 'rimraf'
import * as path from 'path'
import { runCommand } from './util'

const cwd = process.cwd()

const getEnvProduction = async () => {
  const stdout = await runCommand(`git describe`)
  return `
NEXT_PUBLIC_APP_REVISION=${stdout}
  `.trim()
}

const run = async () => {
  const buildDir = path.join(cwd, '.next-tf')
  rimraf.sync(buildDir)

  const envProduction = await getEnvProduction()
  fs.writeFileSync(path.join(cwd, '.env.production'), envProduction)
  console.log('.env.production is created')
}

if (require.main === module) {
  run()
}

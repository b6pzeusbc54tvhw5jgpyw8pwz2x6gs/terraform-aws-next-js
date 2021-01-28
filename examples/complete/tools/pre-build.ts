import rimraf from 'rimraf'
import * as path from 'path'

const cwd = process.cwd()

const run = () => {
  const buildDir = path.join(cwd, '.next-tf')
  rimraf.sync(buildDir)
}

if (require.main === module) {
  run()
}

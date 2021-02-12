import {ExecaError, ExecaReturnValue} from 'execa'
import * as execa from 'execa'
import to from 'await-to-js'
import packageJson from '../package.json'

export const projectName = process.env.PROJECT_NAME || packageJson.name
export const branchOrTag = process.env.BRANCH_OR_TAG || `default`

export const getLambdaFunctionName = (lambdaSuffix: string, type: 'API' | 'PAGE') => {
  return type === 'API'
    ? `${projectName}-api-${lambdaSuffix}`
    : `${projectName}-page-${lambdaSuffix}`
}

interface RunCommandOptions {
  format?: 'json' | 'string'
}

export const runCommand = async (command: string, options: RunCommandOptions={}) => {
  const {format='string'} = options
  const trimmedCommand = command.trim()

  const [err, res] = await to<ExecaReturnValue<string>, ExecaError>(execa.command(trimmedCommand))
  console.log('\n========== Run command:')
  console.log(`$ ${trimmedCommand}`)
  if (err) throw new Error(err.stderr.trim())

  console.log(res.stdout)

  return format === 'json'
    ? JSON.parse(res.stdout.trim())
    : res.stdout.trim()
}

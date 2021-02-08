import {ExecaError, ExecaReturnValue} from 'execa'
import * as execa from 'execa'
import to from 'await-to-js'

export const runCommand = async (command: string) => {
  console.log('\n========== Run command:')
  console.log(`$ ${command}`)

  const subProcess = execa.command(command)
  subProcess.stdout.pipe(process.stdout)

  const [err, res] = await to<ExecaReturnValue<string>, ExecaError>(subProcess)
  if (err) throw new Error(err.stderr.trim())

  return res.stdout.trim()
}

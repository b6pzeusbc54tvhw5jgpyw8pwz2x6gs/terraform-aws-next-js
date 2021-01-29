import * as fs from 'fs'
import * as path from 'path'
import packageJson from '../package.json'

const cwd = process.cwd()
const identifier = process.env.LAMBDA_IDENTIFIER || packageJson.name
const revisionOrTag = process.env.GIT_REVISION || `default`

const getBuildId = (buildDir: string) => {
  const {buildId} = require(path.join(buildDir,'config.json'))
  if (!buildId) throw new Error('No bulidId')
  console.log('buildId: ' + buildId)

  return buildId
}

const getRouteName = (buildId: string, type: 'API' | 'PAGE') => {
  return type === 'API'
    ? `${identifier}-api-${buildId}`
    : `${identifier}-page-${buildId}`
}

const getLambdaFunctionName = (lambdaSuffix: string, type: 'API' | 'PAGE') => {
  return type === 'API'
    ? `${identifier}-api-${lambdaSuffix}`
    : `${identifier}-page-${lambdaSuffix}`
}

const getConfigFile = (buildDir: string): string => {
  const source = path.join(buildDir, 'config.json')
  return fs.readFileSync(source, 'utf-8')
}

const backupConfig = (buildDir: string) => {
  const source = path.join(buildDir, 'config.json')
  const target = path.join(buildDir, 'config.backup.json')
  fs.copyFileSync(source, target)
}

const replaceWithLambdaFunctionName = (config: string, lambdaSuffix: string) => {
  const modified = config
    .replace(/__NEXT_API_LAMBDA_0/g, getLambdaFunctionName(lambdaSuffix, 'API'))
    .replace(/__NEXT_PAGE_LAMBDA_0/g,getLambdaFunctionName(lambdaSuffix, 'PAGE'))

  return modified
}

const renameLambdaZipFiles = (buildId: string, buildDir: string) => {
  try {
    fs.renameSync(
      path.join(buildDir,'lambdas/__NEXT_API_LAMBDA_0.zip'),
      path.join(buildDir,`lambdas/${getRouteName(buildId,'API')}.zip`)
    )
    fs.renameSync(
      path.join(buildDir,'lambdas/__NEXT_PAGE_LAMBDA_0.zip'),
      path.join(buildDir,`lambdas/${getRouteName(buildId,'PAGE')}.zip`)
    )
  } catch(err) {
    if (err.code === 'ENOENT') {
      console.log(`Can not found '__NEXT_*_LAMBDA_0.zip' files. First run 'yarn tfbuild'`)
      throw err
    }
  }
}

const replaceLambdaFunctionName = (modifiedConfig: string, buildId: string) => {
  const configJson = JSON.parse(modifiedConfig)
  const modified = {
    ...configJson,
    lambdas: {
      __NEXT_API_LAMBDA_0: {
        ...configJson.lambdas.__NEXT_API_LAMBDA_0,
        filename: `lambdas/${getRouteName(buildId,'API')}.zip`
      },
      __NEXT_PAGE_LAMBDA_0: {
        ...configJson.lambdas.__NEXT_PAGE_LAMBDA_0,
        filename: `lambdas/${getRouteName(buildId,'PAGE')}.zip`,
      },
    },
  }
  return JSON.stringify(modified,null,2)
}

const run = () => {
  const buildDir = path.join(cwd, '.next-tf')
  const buildId = getBuildId(buildDir)
  backupConfig(buildDir)
  let modifiedConfig = getConfigFile(buildDir)
  modifiedConfig = replaceLambdaFunctionName(modifiedConfig, buildId)
  modifiedConfig = replaceWithLambdaFunctionName(modifiedConfig, revisionOrTag)

  fs.writeFileSync(path.join(buildDir, 'config.json'), modifiedConfig)
  renameLambdaZipFiles(buildId, buildDir)
}

if (require.main === module) {
  run()
}

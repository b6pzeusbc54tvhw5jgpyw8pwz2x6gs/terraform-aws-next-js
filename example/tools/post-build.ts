import * as fs from 'fs'
import * as path from 'path'
import { branchOrTag, getLambdaFunctionName, projectName } from './helpers'

const cwd = process.cwd()

const getBuildId = (buildDir: string) => {
  const {buildId} = require(path.join(buildDir,'config.json'))
  if (!buildId) throw new Error('No bulidId')
  console.log('buildId: ' + buildId)

  return buildId
}

const getRouteName = (buildId: string, type: 'API' | 'PAGE') => {
  return type === 'API'
    ? `${projectName}-api-${buildId}`
    : `${projectName}-page-${buildId}`
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

const modifyLambdas = (modifiedConfig: string, buildId: string) => {
  const configJson = JSON.parse(modifiedConfig)
  const modified = {
    ...configJson,
    lambdas: {
      __NEXT_API_LAMBDA_0: {
        ...configJson.lambdas.__NEXT_API_LAMBDA_0,
        filename: `lambdas/${getRouteName(buildId,'API')}.zip`,
        memory: 1024,
        timeout: 5,
      },
      __NEXT_PAGE_LAMBDA_0: {
        ...configJson.lambdas.__NEXT_PAGE_LAMBDA_0,
        filename: `lambdas/${getRouteName(buildId,'PAGE')}.zip`,
        memory: 1024,
        timeout: 5,
      },
    },
  }
  return JSON.stringify(modified,null,2)
}

const createProxyConfig = (config: string) => {
  const json = JSON.parse(config)
  const proxyConfig = {
    buildId: json.buildId,
    routes: json.routes,
    staticRoutes: json.staticRoutes,
    lambdaRoutes: Object.keys(json.lambdas).map((key:string) => json.lambdas[key].route),
    prerenders: json.prerenders,
  }
  return JSON.stringify(proxyConfig,null,2)
}

const run = () => {
  const buildDir = path.join(cwd, '.next-tf')
  const buildId = getBuildId(buildDir)
  backupConfig(buildDir)
  const configStr = getConfigFile(buildDir)
  let modifiedConfig = modifyLambdas(configStr, buildId)
  modifiedConfig = replaceWithLambdaFunctionName(modifiedConfig, branchOrTag)

  fs.writeFileSync(path.join(buildDir, 'config.json'), modifiedConfig)

  const proxyConfig = createProxyConfig(modifiedConfig)
  fs.writeFileSync(path.join(buildDir, 'proxy-config.json'), proxyConfig)

  renameLambdaZipFiles(buildId, buildDir)

  fs.unlinkSync(path.join(cwd, '.env.production'))
}

if (require.main === module) {
  run()
}

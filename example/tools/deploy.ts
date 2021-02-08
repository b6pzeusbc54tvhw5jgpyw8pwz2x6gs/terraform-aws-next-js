import * as path from 'path'
import to from 'await-to-js'
import packageJson from '../package.json'
import { runCommand } from './util'

const namePrefix = process.env.LAMBDA_IDENTIFIER || packageJson.name
const branchOrTag = process.env.BRANCH_OR_TAG || `default`
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION
const TFNEXT_STATIC_UPLOAD_BUCKET = process.env.TFNEXT_STATIC_UPLOAD_BUCKET
const TFNEXT_PROXY_CONFIG_BUCKET = process.env.TFNEXT_PROXY_CONFIG_BUCKET
const TFNEXT_LAMBDA_ROLE_ARN = process.env.TFNEXT_LAMBDA_ROLE_ARN
const TFNEXT_APIGW_API_EXECUTION_ARN = process.env.TFNEXT_APIGW_API_EXECUTION_ARN
const TFNEXT_APIGW_API_ID = process.env.TFNEXT_APIGW_API_ID

const getBuildId = (buildDir: string) => {
  const {buildId} = require(path.join(process.cwd(), buildDir,'config.json'))
  if (!buildId) throw new Error('No bulidId')
  console.log('buildId: ' + buildId)

  return buildId
}

interface Lambda {
  handler: string
  runtime: string
  filename: string
  route: string
  timeout: number
  memory: number
}

const run = async () => {
  const buildId = getBuildId('./.next-tf')

  // static upload
  await runCommand(`aws s3 cp .next-tf/static-website-files.zip s3://${TFNEXT_STATIC_UPLOAD_BUCKET}/${buildId}/`)

  // lambda
  const configJson = require('../.next-tf/config.json')
  const promises = Object.keys(configJson.lambdas).map(async (functionName: string) => {
    const lambda: Lambda = configJson.lambdas[functionName]
    const absFilePath = path.resolve('./.next-tf', lambda.filename)
    const [err,stdout] = await to(runCommand(`aws lambda get-function --function-name ${functionName}`))
    if (/^An error occurred \(ResourceNotFoundException\).*$/.test(err?.message)) {
      console.log('========== Lambda function name to create: ' + functionName)
      const res = await runCommand(`
        aws lambda create-function --function-name ${functionName}
          --runtime ${lambda.runtime} --timeout ${lambda.timeout}
          --memory-size ${lambda.memory} --role ${TFNEXT_LAMBDA_ROLE_ARN}
          --zip-file fileb://${absFilePath} --handler now__launcher.launcher
          --description ${namePrefix}\\ nextjs
          --publish
      `.trim().split('\n').map(v => v.trim()).join(' '))

      const functionArn = JSON.parse(res).FunctionArn

      await runCommand(`
        aws lambda add-permission --function-name ${functionName}
          --action lambda:InvokeFunction --statement-id AllowInvokeFromApiGateway
          --principal apigateway.amazonaws.com
          --source-arn ${TFNEXT_APIGW_API_EXECUTION_ARN}/*/*/*
      `.trim().split('\n').map(v => v.trim()).join(' '))

      const integrationRes = await runCommand(`
        aws apigatewayv2 create-integration --api-id ${TFNEXT_APIGW_API_ID}
          --integration-type AWS_PROXY --description ${namePrefix}\\ ${branchOrTag}
          --connection-type INTERNET --integration-method POST
          --integration-uri arn:aws:apigateway:${AWS_DEFAULT_REGION}:lambda:path/2015-03-31/functions/${functionArn}/invocations
          --payload-format-version 2.0 --timeout-in-millis ${lambda.timeout*1000 + 500}
      `.trim().split('\n').map(v => v.trim()).join(' '))
      const integrationId = JSON.parse(integrationRes).IntegrationId

      await runCommand(`
        aws apigatewayv2 create-route --api-id ${TFNEXT_APIGW_API_ID}
        --route-key ANY\\ /${functionName}/{proxy+}
        --target integrations/${integrationId}
      `.trim().split('\n').map(v => v.trim()).join(' '))

      await runCommand(`aws logs create-log-group --log-group-name /aws/lambda/${functionName} `)
      await runCommand(`aws logs put-retention-policy --log-group-name /aws/lambda/${functionName} --retention-in-days 60`)
    } else if (JSON.parse(stdout)) {
      console.log('Lambda function name to update: ' + functionName)
      await runCommand(`aws lambda update-function-code --function-name ${functionName} --zip-file fileb://${absFilePath} --publish`)
    } else {
      throw err || new Error('Unknown result')
    }
  })

  await Promise.all(promises)

  // proxy-config
  await runCommand(`aws s3 cp .next-tf/proxy-config.json s3://${TFNEXT_PROXY_CONFIG_BUCKET}/proxy-config-${buildId}.json`)
  await runCommand(`aws s3 cp .next-tf/proxy-config.json s3://${TFNEXT_PROXY_CONFIG_BUCKET}/proxy-config.json`)
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

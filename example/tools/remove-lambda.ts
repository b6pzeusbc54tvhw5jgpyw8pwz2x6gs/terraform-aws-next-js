import to from 'await-to-js'
import { getLambdaFunctionName, runCommand } from './helpers'

const TFNEXT_APIGW_API_ID = process.env.TFNEXT_APIGW_API_ID

/*
const deleteStatic = async (buildId: string) => {
  // static upload
  // await runCommand(`aws s3 cp .next-tf/static-website-files.zip s3://${TFNEXT_STATIC_UPLOAD_BUCKET}/${buildId}/`)
  await runCommand(`aws s3 rm --recursive s3://${TFNEXT_STATIC_DEPLOY_BUCKET}/${buildId}/`)
}
*/

interface RouteItem {
  "ApiKeyRequired": boolean
  "AuthorizationType": string
  "RouteId": string
  "RouteKey": string  // "ANY /tfnext-page-default/{proxy+}"
  "Target": string
}

interface GetRoutesRes {
  Items: RouteItem[]
}

const deleteLambda = async (functionName: string) => {
  const routesRes: GetRoutesRes = await runCommand(`
    aws apigatewayv2 get-routes --api-id ${TFNEXT_APIGW_API_ID}
  `, {format: 'json'})

  const routesToDelete = routesRes.Items
    .filter(r => r.RouteKey === `ANY /${functionName}/{proxy+}`)

  const promises = routesToDelete.map(async r => {
    await to(runCommand(`
      aws apigatewayv2 delete-route --api-id ${TFNEXT_APIGW_API_ID} --route-id ${r.RouteId}
    `))

    const integrationId = r.Target.split('/')[1]
    await runCommand(`
      aws apigatewayv2 delete-integration --api-id ${TFNEXT_APIGW_API_ID} --integration-id ${integrationId}
    `)
  })

  await Promise.all(promises)
  const [err] = await to(runCommand(`aws lambda delete-function --function-name ${functionName}`))
  if (err && /^An error occurred \(ResourceNotFoundException\).*$/.test(err.message)) {
    console.log('Failed delete: ResourceNotFoundException')
  } else if (err) {
    throw err
  }
}

const startAsync = async () => {
  try {
    const branchOrTag = process.argv[2]
    console.log('branchOrTag: ' + branchOrTag)
    if (!branchOrTag) throw new Error('branchOrTag is required')

    const pageLambda = getLambdaFunctionName(branchOrTag, 'PAGE')
    const apiLambda = getLambdaFunctionName(branchOrTag, 'API')

    await deleteLambda(pageLambda)
    await deleteLambda(apiLambda)
  } catch(err) {
    console.error(err)
    process.exit(1)
  }
}

if (require.main === module) {
  startAsync()
}

import * as path from 'path';
import { S3Handler } from 'aws-lambda';
import { S3, CloudFront } from 'aws-sdk';

import { deployTrigger } from './deploy-trigger';
import { generateRandomId } from './utils';

export const handler: S3Handler = async function (event) {
  const s3 = new S3({ apiVersion: '2006-03-01' });
  const deployBucket = process.env.TARGET_BUCKET;
  const distributionId = process.env.DISTRIBUTION_ID;

  // Get needed information of the event
  const { object } = event.Records[0].s3;
  const { versionId, key } = object;
  const sourceBucket = event.Records[0].s3.bucket.name;

  // zip file should be uploaded into `s3://${buildId}/`
  const buildId = path.basename(path.dirname(key))
  console.log('triggered static deploy by buildId: ' + buildId)

  // Unpack the package
  await deployTrigger({
    s3, sourceBucket, deployBucket, key, versionId, buildId,
  })

  await Promise.all([
    s3.copyObject({
      CopySource: `/${deployBucket}/${buildId}/404`,
      Bucket: deployBucket, Key: '404',
    }).promise(),
    s3.copyObject({
      CopySource: `/${deployBucket}/${buildId}/500`,
      Bucket: deployBucket, Key: '500',
    }).promise(),
  ])

  const cloudFront = new CloudFront({ apiVersion: '2020-05-31' });
  await cloudFront.createInvalidation({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `${new Date().getTime()}-${generateRandomId(4)}`,
      // Invalidation of other paths are unnesessary.
      // Because it use immutable paths like `/${buildId}/*` expect /404, /500
      Paths: { Quantity: 2, Items: ['/404', '/500'] },
    }
  }).promise()
};

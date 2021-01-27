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
  });

  const cloudFront = new CloudFront({ apiVersion: '2020-05-31' });
  await cloudFront.createInvalidation({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `${new Date().getTime()}-${generateRandomId(4)}`,
      Paths: { Quantity: 1, Items: ['/*'] }
    }
  }).promise()
};

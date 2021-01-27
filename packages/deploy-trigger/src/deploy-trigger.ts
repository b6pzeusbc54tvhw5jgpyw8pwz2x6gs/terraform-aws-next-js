import * as path from 'path';
import { S3 } from 'aws-sdk';
import unzipper from 'unzipper';
import { getType } from 'mime';

import { deploymentConfigurationKey } from './constants';

// Immutable files like css, js, images with hashed file names
const CacheControlImmutable = 'public,max-age=31536000,immutable';
// Static pre-rendered HTML routes
// -
// Must be refetched by the browser every time (max-age=0)
// But CloudFront CDN can hold the copy infinite time until a invalidation
// removes it (s-maxage=31536000)
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html#ExpirationDownloadDist
const CacheControlStaticHtml =
  'public,max-age=0,must-revalidate,s-maxage=31536000';

interface Props {
  s3: S3;
  sourceBucket: string;
  deployBucket: string;
  buildId: string;
  key: string;
  versionId?: string;
}

interface Response {
  files: string[];
  buildManifestContent: string;
}

export async function deployTrigger(props: Props): Promise<Response> {
  const { s3, key, sourceBucket, deployBucket, versionId, buildId } = props
  const params = { Key: key, Bucket: sourceBucket, VersionId: versionId };

  // Get the object that triggered the event
  const zip = s3
    .getObject(params)
    .createReadStream()
    .pipe(unzipper.Parse({ forceStream: true }));

  const uploads: Promise<S3.ManagedUpload.SendData>[] = [];
  // Keep track of all files that are processed
  const files: string[] = [];
  let buildManifestContent = ''

  for await (const e of zip) {
    const entry = e as unzipper.Entry;

    const fileName = entry.path;
    const type = entry.type;
    if (type === 'File') {
      // Get ContentType
      // Static pre-rendered pages have no file extension,
      // files without extension get HTML mime type as fallback
      const ContentType = getType(fileName) || 'text/html';

      let buffer: Buffer | null = null
      if (fileName === `_next/static/${buildId}/_buildManifest.js`) {
        buffer = await entry.buffer()
        buildManifestContent = buffer.toString()
      }
 
      const Key = fileName.startsWith('_next/static/')
        ? path.join(`static`,buildId,fileName)
        : path.join(buildId, fileName)

      const uploadParams: S3.Types.PutObjectRequest = {
        Bucket: deployBucket,
        Key,
        Body: buffer || entry,
        ContentType,
        CacheControl: ContentType === 'text/html'
          ? CacheControlStaticHtml
          : CacheControlImmutable,
      };

      // Sorry, but you cannot override the manifest
      if (fileName !== deploymentConfigurationKey) {
        files.push(fileName);
        uploads.push(s3.upload(uploadParams).promise());
      }
    } else {
      entry.autodrain();
    }
  }

  await Promise.all(uploads);

  // Cleanup
  await s3.deleteObject(params).promise();

  return { files, buildManifestContent };
}

import * as fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import {
  S3Client,
  ListObjectsV2Command,
  _Object,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectAclCommand,
  GetBucketAclCommand,
} from '@aws-sdk/client-s3';

// NOTE: more info about Access control list (ACL) : https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html

dotenv.config({
  path: path.join(__dirname, '../.env'),
});

enum PERMISSION {
  WRITE = 'WRITE',
  FULL_CONTROL = 'FULL_CONTROL',
}

const PERMISSION_LIST_FOR_DELETE: string[] = [PERMISSION.WRITE, PERMISSION.FULL_CONTROL];

const bucketName = process.env.S3_BUCKET_NAME || '';

const client = new S3Client({
  region: process.env.S3_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const findLastModifiedObject = (s3ObjectArray: _Object[]): _Object | undefined => {
  if (!s3ObjectArray.length) {
    return;
  }
  let lastObject = s3ObjectArray[0];
  for (const s3Object of s3ObjectArray) {
    if (s3Object.LastModified && lastObject.LastModified && s3Object.LastModified > lastObject.LastModified) {
      lastObject = s3Object;
    }
  }
  return lastObject;
};

export const getS3LastObjectInDirectory = async (pathDirectory: string): Promise<_Object | undefined> => {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    // The default and maximum number of keys returned is 1000. This limits it to
    // one for demonstration purposes.
    MaxKeys: 10000,
    // Note: Prefix is directory you need to fetch
    Prefix: pathDirectory,
  });

  try {
    let isTruncated = true;
    let contents = '';
    let s3ObjectArray: _Object[] = [];
    const loopNumbers: number[] = [];
    let i = 0;
    // NOTE: Loop while will not require if you sure that files in directory will not greater than MaxKeys
    while (isTruncated) {
      loopNumbers.push(++i);
      const { Contents, IsTruncated, NextContinuationToken } = await client.send(command);
      if (Contents) {
        s3ObjectArray = s3ObjectArray.concat(Contents);
        const contentsList = Contents.map((c) => `• ${c.Key}`).join('\n');
        contents += contentsList + '\n';
        isTruncated = IsTruncated ?? false;
        command.input.ContinuationToken = NextContinuationToken;
      } else {
        isTruncated = false;
      }
    }

    let lastObject;
    if (s3ObjectArray.length) {
      lastObject = findLastModifiedObject(s3ObjectArray);
    }
    // NOTE: Just for write logs
    const dataToWrite = { loopNumbers, s3ObjectArray, lastObject, contents };
    fs.writeFileSync(path.join(__dirname, '../logs/result.json'), JSON.stringify(dataToWrite, null, 2));

    return lastObject;
  } catch (error) {
    console.error(error);
  }
};

const getObjectAcl = async (key: string) => {
  const command = new GetObjectAclCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response = await client.send(command);
    console.log(' getObjectAcl response', response);
    console.log(response);
    return response;
  } catch (err: any) {
    console.log(' getObjectAcl err ---> ', err);
    if (err.$metadata?.httpStatusCode && err.$metadata?.httpStatusCode === 404) {
      throw Error(`File: ${key} not exists.`);
    }
    throw err;
  }
};

export const checkHasDeletePermission = async (key: string): Promise<boolean> => {
  try {
    const objectAcl = await getObjectAcl(key);
    const grants = objectAcl?.Grants || [];
    console.log(' grants ', grants);
    for (const grant of grants) {
      if (PERMISSION_LIST_FOR_DELETE.includes(grant.Permission || '')) {
        return true;
      }
    }
    return false;
  } catch (err) {
    throw err;
  }
  return false;
};

export const deleteS3Object = async (key: string) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};

export const copyS3Object = async (sourceKey: string, newKey: string) => {
  const command = new CopyObjectCommand({
    CopySource: `${bucketName}/${sourceKey}`,
    Bucket: bucketName,
    Key: newKey,
  });

  try {
    const response = await client.send(command);
    console.log(response);
    return response;
  } catch (err) {
    console.error(err);
    return err;
  }
};

export const renameS3Object = async (sourceKey: string, newKey: string) => {
  if (sourceKey === newKey) {
    throw Error('You sourceKey and newKey are same.');
  }

  const hasDeletePermission = await checkHasDeletePermission(sourceKey);
  if (!hasDeletePermission) {
    throw Error("You don't have delete permission.");
  }

  try {
    const response = await copyS3Object(sourceKey, newKey);
    console.log(response);
  } catch (err) {
    console.error(err);
    throw err;
  }

  // Note: delete old object
  try {
    const response = await deleteS3Object(sourceKey);
    console.log(response);
  } catch (err) {
    console.error(err);
    // TODO: handle when cannot delete (may be email/slack message to admin )
    throw err;
  }
};

export const getBucketAcl = async () => {
  const command = new GetBucketAclCommand({
    Bucket: bucketName,
  });

  try {
    const response = await client.send(command);
    console.log('getBucketAcl() -----> ', response);
    console.log('grants -----> ', response.Grants);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};

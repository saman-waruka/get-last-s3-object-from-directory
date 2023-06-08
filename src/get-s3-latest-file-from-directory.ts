import * as fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { S3Client, ListObjectsV2Command, _Object } from "@aws-sdk/client-s3";

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

console.log(" env ", process.env);

const client = new S3Client({
  region: process.env.S3_REGION || "eu-central-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

const findLastModifiedObject = (s3ObjectArray: _Object[]) => {
  if (!s3ObjectArray.length) {
    return;
  }
  let lastObject = s3ObjectArray[0];
  for (const s3Object of s3ObjectArray) {
    if (
      s3Object.LastModified &&
      lastObject.LastModified &&
      s3Object.LastModified > lastObject.LastModified
    ) {
      lastObject = s3Object;
    }
  }
  return lastObject;
};

const getS3LastObjectInDirectory = async (
  bucketName: string,
  pathDirectory: string
) => {
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
    let contents = "";
    let s3ObjectArray: _Object[] = [];
    const loopNumbers: number[] = [];
    let i = 0;
    // NOTE: Loop while will not require if you sure that files in directory will not greater than MaxKeys
    while (isTruncated) {
      loopNumbers.push(++i);
      const { Contents, IsTruncated, NextContinuationToken } =
        await client.send(command);
      if (Contents) {
        s3ObjectArray = s3ObjectArray.concat(Contents);
        const contentsList = Contents.map((c) => `• ${c.Key}`).join("\n");
        contents += contentsList + "\n";
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
    fs.writeFileSync(
      path.join(__dirname, "../logs/result.json"),
      JSON.stringify(dataToWrite, null, 2)
    );
    return lastObject;
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  const bucketName = process.env.S3_BUCKET_NAME || "";
  const orgId = process.env.ORG_ID;
  const inputConnector = process.env.INPUT_ID;
  const pathToDirectory = `${orgId}/${inputConnector}`;
  const lastS3Object = await getS3LastObjectInDirectory(
    bucketName,
    pathToDirectory
  );
  console.log("lastS3Object", lastS3Object);
})();

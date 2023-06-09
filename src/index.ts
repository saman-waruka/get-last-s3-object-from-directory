import dotenv from 'dotenv';
import path from 'path';
import {
  getS3LastObjectInDirectory,
  copyS3Object,
  checkHasDeletePermission,
  deleteS3Object,
  renameS3Object,
  getBucketAcl,
} from './utils';

dotenv.config({
  path: path.join(__dirname, '../.env'),
});

(async () => {
  const pathToDirectory = process.env.S3_DIRECTORY || 'test-directory';
  let lastS3Object = await getS3LastObjectInDirectory(pathToDirectory);
  console.log('lastS3Object before', lastS3Object);

  // getBucketAcl();

  // const lastS3Object2 = await getS3LastObjectInDirectory(pathToDirectory);
  // console.log('lastS3Object 2 ', lastS3Object2);

  const hasDeletePermission = await checkHasDeletePermission('test-directory/test.csv');
  console.log('hasDeletePermission', hasDeletePermission);

  await renameS3Object('test-directory/test.csv', 'test-directory/test2.csv');

  lastS3Object = await getS3LastObjectInDirectory(pathToDirectory);
  console.log('lastS3Object after rename', lastS3Object);

  // const deleteS3response = await deleteS3Object(
  //   '63f43e261c26e1a6566d47dd/647ee73d00228d7a341eb132/1686131640507-2023-06-07T09:54:00.507Z/parsed_input_new_test_manual.json',
  // );

  // const getBucketAclResponse = await getBucketAcl();
  // console.log('getBucketAclResponse', getBucketAclResponse);
})();

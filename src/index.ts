import dotenv from 'dotenv';
import path from 'path';
import {
  getS3LastObjectInDirectory,
  copyS3Object,
  checkHasDeletePermission,
  deleteS3Object,
  renameS3Object,
} from './utils';

dotenv.config({
  path: path.join(__dirname, '../.env'),
});

(async () => {
  const orgId = process.env.ORG_ID;
  const inputConnector = process.env.INPUT_ID;
  const pathToDirectory = `${orgId}/${inputConnector}`;
  // const lastS3Object = await getS3LastObjectInDirectory(pathToDirectory);
  // console.log('lastS3Object', lastS3Object);

  //  create my file with new key
  // if (lastS3Object) {
  //   const copyResponse = await copyS3Object(
  //     lastS3Object?.Key || '',
  //     '63f43e261c26e1a6566d47dd/647ee73d00228d7a341eb132/1686131640507-2023-06-07T09:54:00.507Z/parsed_input_new_test_manual.json',
  //   );

  //   console.log('copyResponse ', copyResponse);
  // }

  await renameS3Object(
    '63f43e261c26e1a6566d47dd/647ee73d00228d7a341eb132/1686131640507-2023-06-07T09:54:00.507Z/parsed_input_new_test_manual99.json',
    '63f43e261c26e1a6566d47dd/647ee73d00228d7a341eb132/1686131640507-2023-06-07T09:54:00.507Z/parsed_input_new_test_manual98.json',
  );

  const lastS3Object2 = await getS3LastObjectInDirectory(pathToDirectory);
  console.log('lastS3Object 2 ', lastS3Object2);

  // checkHasDeletePermission(
  //   '63f43e261c26e1a6566d47dd/647ee73d00228d7a341eb132/1686131640507-2023-06-07T09:54:00.507Z/parsed_input_new_test_manual.json',
  // );

  // const deleteS3response = await deleteS3Object(
  //   '63f43e261c26e1a6566d47dd/647ee73d00228d7a341eb132/1686131640507-2023-06-07T09:54:00.507Z/parsed_input_new_test_manual.json',
  // );
})();

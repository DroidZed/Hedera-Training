import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicInfoQuery,
  TopicMessageSubmitTransaction,
  TopicUpdateTransaction,
} from '@hashgraph/sdk';
import { ACC_ID, PRIV_KEY } from './config/env.js';

async function run() {
  const client = Client.forTestnet();

  const operatorKey = PrivateKey.fromString(PRIV_KEY);

  const adminKey = PrivateKey.generate();
  const submitKey = PrivateKey.generate();

  client.setOperator(ACC_ID, operatorKey);

  const topic = new TopicCreateTransaction()
    .setAdminKey(adminKey)
    .setSubmitKey(submitKey)
    .setTopicMemo('First Memo')
    .freezeWith(client);

  const signedTx1 = await topic.sign(adminKey);

  const signedTx2 = await signedTx1.sign(submitKey);

  const txResponse = await signedTx2.execute(client);

  const receipt = await txResponse.getReceipt(client);

  const topicId = receipt.topicId;

  const topicInfoResponse = await new TopicInfoQuery()
    // @ts-ignore
    .setTopicId(topicId)
    .execute(client);

  console.log(`The topic ID is: ${topicInfoResponse.topicId}`);

  console.log(`Topic memo is: ${topicInfoResponse.topicMemo}`);

  const updateTransact = new TopicUpdateTransaction()
    // @ts-ignore
    .setTopicId(topicId)
    .setTopicMemo('Another memo !')
    .freezeWith(client);

  const sign3 = await updateTransact.sign(adminKey);
  const sign4 = await sign3.sign(submitKey);
  await sign4.execute(client);

  const topicInfoResponse2 = await new TopicInfoQuery()
    // @ts-ignore
    .setTopicId(topicId)
    .execute(client);

  console.log(`Updated Topic memo: ${topicInfoResponse2.topicMemo}`);

  const message = await new TopicMessageSubmitTransaction()
    // @ts-ignore
    .setTopicId(topicId)
    .setMessage('This is my message !')
    .execute(client);

  console.log(`Topic message: ${message}`);
  return;
}

run().catch((err) => console.log(err));

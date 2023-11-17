import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';
import { ACC_ID, PRIV_KEY } from './config/env.js';

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

console.log(`The new topic ID is ${topicId}`);

console.log(`Topic memo: ${topic.getTopicMemo()}`);

topic.setTopicMemo('Another memo');

console.log(`New memo: ${topic.getTopicMemo()}`);

//Create the transaction
const transaction = await new TopicMessageSubmitTransaction()
  .setTopicId(topicId.toString())
  .setMessage('hello this is my first message! ')
  .execute(client);

//Get the transaction message

console.log(`Topic message: ${transaction}`);

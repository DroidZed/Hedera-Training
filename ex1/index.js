import {
  AccountId,
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicInfoQuery,
  TopicMessageQuery,
  TopicMessageSubmitTransaction,
  TopicUpdateTransaction,
} from '@hashgraph/sdk';
import { ACC_ID, PRIV_KEY } from './config/env.js';

async function run() {
  // loading keys from env
  const operatorKey = PrivateKey.fromString(PRIV_KEY);
  const accountId = AccountId.fromString(ACC_ID);
  // creation of necessary keys (admin and submit)
  const adminKey = PrivateKey.generate();
  const submitKey = PrivateKey.generate();
  // instantiating the client
  const client = Client.forTestnet().setOperator(accountId, operatorKey);
  // creating our first topic memo
  let topic = new TopicCreateTransaction()
    .setAdminKey(adminKey)
    .setSubmitKey(submitKey)
    .setTopicMemo('First Memo')
    .freezeWith(client);
  // signing the topic memo
  const signedTx1 = await topic.sign(adminKey);
  const signedTx2 = await signedTx1.sign(submitKey);
  const txResponse = await signedTx2.execute(client);
  // getting the receipt
  const receipt = await txResponse.getReceipt(client);
  const topicId = receipt.topicId;
  // wait 5 seconds between consensus topic creation and subscription topic creation
  await new Promise((resolve) => setTimeout(resolve, 5000));
  // querying the topic
  const topicInfoResponse = await new TopicInfoQuery()
    // @ts-ignore
    .setTopicId(topicId)
    .execute(client);
  console.log(` >> The topic ID is: ${topicInfoResponse.topicId}`);
  console.log(` >> Topic memo is: ${topicInfoResponse.topicMemo}`);

  //Create the query
  new TopicMessageQuery()
    // @ts-ignore
    .setTopicId(topicId)
    .setStartTime(0)
    .subscribe(client, null, function (msg) {
      let messageAsString = Buffer.from(
        String(msg.contents),
        'utf8'
      ).toString();
      console.log(
        `${msg.consensusTimestamp.toDate()} - Sequence number: ${
          msg.sequenceNumber
        } - Message: ${messageAsString}`
      );
    });

  // creating an update transaction for the old topic memo
  let updateTransact = new TopicUpdateTransaction()
    // @ts-ignore
    .setTopicId(topicId)
    .setTopicMemo('Another memo !')
    .freezeWith(client);

  // singing it...
  const sign3 = await updateTransact.sign(adminKey);
  const sign4 = await sign3.sign(submitKey);
  await sign4.execute(client);
  // querying the result again
  const topicInfoResponse2 = await new TopicInfoQuery()
    // @ts-ignore
    .setTopicId(topicId)
    .execute(client);
  console.log(` -- Updated Topic memo: ${topicInfoResponse2.topicMemo}`);

  // sending a message to a topic
  const message = await new TopicMessageSubmitTransaction()
    // @ts-ignore
    .setTopicId(topicId)
    .setMessage('This is my message !')
    .execute(client);

  // displaying the message
  console.log(`*** Topic message: ${message} ***\n`);

  client.close();

  return;
}

run().catch((err) => console.log(err));

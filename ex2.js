/**
 * Exercise 2: Token Service
For this exercise you'll need to create 2 additional accounts. 
You will therefore need 3 accounts for this exercise (the portal testnet account and the 2 new accounts).
Using Token Service : 
**Create a collection of NFTs with at least one memo, an adminKey, a supplyKey, Custom Fees (5% royalty fee) 
**and a Fee Schedule Key. 
**The 3 keys specified must be different.
**Display newly created NFT information
**Edit NFT memo
**Display NFT information with modification made
**Mint an NFT on the collection (metadata to be specified are free)
*!Transfer NFT from account A to account B
*?Display the balance of the various accounts involved (account A, account B and account defined as receiving royalty fees)
*?Modify custom fees to increase royalty percentage to 10%.
*?Mine a second NFT from the collection
*?Transfer the second NFT from account A to account B
*?Display the balance of the various accounts involved (account A, account B and account defined as receiving royalty fees)

 */

import {
  AccountBalanceQuery,
  AccountCreateTransaction,
  AccountId,
  Client,
  CustomFixedFee,
  CustomRoyaltyFee,
  Hbar,
  PrivateKey,
  TokenAssociateTransaction,
  TokenCreateTransaction,
  TokenFeeScheduleUpdateTransaction,
  TokenInfoQuery,
  TokenMintTransaction,
  TokenSupplyType,
  TokenType,
  TokenUpdateTransaction,
  TransferTransaction,
} from '@hashgraph/sdk';
import { ACC_ID, PRIV_KEY } from './config/env.js';

async function main() {
  // Set up the client
  const operatorId = AccountId.fromString(ACC_ID);
  const operatorPrivKey = PrivateKey.fromString(PRIV_KEY);

  const encoder = new TextEncoder();

  const client = Client.forTestnet().setOperator(operatorId, operatorPrivKey);

  const accKey1 = PrivateKey.generateED25519();
  const accKey2 = PrivateKey.generateED25519();
  const supplyKey = PrivateKey.generateED25519();
  const feeScheduleKey = PrivateKey.generateED25519();

  const { accountId: accountId1, status: accStatus1 } = await createAccount(
    client,
    operatorPrivKey,
    accKey1
  );
  console.log(
    `>> 1st Account Creation status: ${accStatus1}\n\tCreated acc id: ${accountId1}\n`
  );
  const { accountId: accountId2, status: accStatus2 } = await createAccount(
    client,
    operatorPrivKey,
    accKey2
  );
  console.log(
    `>> 2nd Account Creation status: ${accStatus2}\n\tCreated acc id: ${accountId2}\n`
  );

  const royaltyFee = generateRoyaltyFee(operatorId, 5, 100);
  const { tokenId, status: tokenCreationStatus } = await createNFT(
    client,
    operatorPrivKey,
    feeScheduleKey,
    supplyKey,
    'My Bored APE',
    operatorId,
    [royaltyFee]
  );
  console.log(
    `>> Token Creation status: ${tokenCreationStatus}\n\tCreated token id: ${tokenId}\n`
  );

  const createdTokenInfo = await new TokenInfoQuery()
    // @ts-ignore
    .setTokenId(tokenId)
    .execute(client);
  console.log('>> Created token:');
  console.table(createdTokenInfo);
  console.log('\n');

  const tokenUpdateStatus = await updateNFTMemo(
    client,
    operatorPrivKey,
    tokenId,
    "DroidZed's Awesome NFT Collection!"
  );
  console.log(`>> Token Update status: ${tokenUpdateStatus}\n`);

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const updatedTokenInfo = await new TokenInfoQuery()
    // @ts-ignore
    .setTokenId(tokenId)
    .execute(client);
  console.log(`>> Updated token info:`);
  console.table(updatedTokenInfo);
  console.log('\n');

  const metadataUint8Array = [encoder.encode('Z-NFT-v1.0')];

  const firstMintStatus = await mintNFT(
    client,
    tokenId,
    supplyKey,
    metadataUint8Array
  );
  console.log(`>> First token mined status: ${firstMintStatus}\n`);

  const tokenAssocStatus = await associateNFTAndUser(
    client,
    tokenId,
    accountId1,
    accKey1
  );
  console.log(`>> First token associated status: ${tokenAssocStatus}\n`);

  const { balanceInBars: barsA, nbTokens: nbTokensA } =
    await queryAccountBalance(client, operatorId);
  const { balanceInBars: barsB, nbTokens: nbTokensB } =
    await queryAccountBalance(client, operatorId);

  console.log(
    `
    Accounts balance before transfer:\
    \n\tAccount A: ${barsA}HBAR - ${nbTokensA} Tokens\
    \n\tAccount B: ${barsB}HBAR - ${nbTokensB} Tokens\
    \n`
  );

  const nftTransferStatus = await transferNFT(
    client,
    tokenId,
    1,
    operatorId,
    accountId1,
    accKey1
  );

  console.log(`>> NFT transfer status: ${nftTransferStatus}\n`);

  const { balanceInBars: barsA2, nbTokens: nbTokensA2 } =
    await queryAccountBalance(client, operatorId);
  const { balanceInBars: barsB2, nbTokens: nbTokensB2 } =
    await queryAccountBalance(client, accountId2);

  console.log(
    `
    Accounts balance after second transfer:\
    \n\tAccount A: ${barsA2}HBAR - ${nbTokensA2} Tokens\
    \n\tAccount B: ${barsB2}HBAR - ${nbTokensB2} Tokens\
    \n`
  );

  // *******************************************************************

  const newRoyaltyFee = generateRoyaltyFee(operatorId, 10, 100);

  const royaltyFeeUpdateStatus = await updateRoyaltyFees(
    client,
    feeScheduleKey,
    tokenId,
    [newRoyaltyFee]
  );

  console.log(`>> NFT royalty update fee status: ${royaltyFeeUpdateStatus}\n`);

  const metadataUint8Array2 = [encoder.encode('Z-NFT-v2.0')];

  const firstMintStatus2 = await mintNFT(
    client,
    tokenId,
    supplyKey,
    metadataUint8Array2
  );

  console.log(`>> Second token mined status: ${firstMintStatus2}\n`);

  const tokenAssocStatus2 = await associateNFTAndUser(
    client,
    tokenId,
    accountId2,
    accKey2
  );

  console.log(`>> Second token associated status: ${tokenAssocStatus2}\n`);

  const nftTransferStatus2 = await transferNFT(
    client,
    tokenId,
    2,
    operatorId,
    accountId2,
    accKey2
  );

  console.log(`>> NFT transfer status: ${nftTransferStatus2}\n`);

  const { balanceInBars: barsA3, nbTokens: nbTokensA3 } =
    await queryAccountBalance(client, operatorId);
  const { balanceInBars: barsB3, nbTokens: nbTokensB3 } =
    await queryAccountBalance(client, accountId2);

  console.log(
    `
    Accounts balance after second transfer:\
    \n\tAccount A: ${barsA3}HBAR - ${nbTokensA3} Tokens\
    \n\tAccount B: ${barsB3}HBAR - ${nbTokensB3} Tokens\
    \n`
  );

  console.log('============== FIN ===========');

  client.close();

  return;
}

async function updateRoyaltyFees(client, feeScheduleKey, tokenId, customFee) {
  //Create the transaction and freeze for manual signing
  const tx = new TokenFeeScheduleUpdateTransaction()
    .setTokenId(tokenId)
    .setCustomFees(customFee)
    .freezeWith(client);

  const signedTx = await tx.sign(feeScheduleKey);

  const txResp = await signedTx.execute(client);

  const { status } = await txResp.getReceipt(client);

  return status.toString();
}

async function queryAccountBalance(client, accountId) {
  const { hbars, tokens } = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client);

  return { balanceInBars: hbars, nbTokens: tokens?.toString() };
}

async function associateNFTAndUser(client, tokenId, nftOwnerId, nftOwnerKey) {
  const tx = new TokenAssociateTransaction()
    .setAccountId(nftOwnerId)
    .setTokenIds([tokenId])
    .freezeWith(client);

  const signedTx = await tx.sign(nftOwnerKey);

  const txResp = await signedTx.execute(client);

  const { status } = await txResp.getReceipt(client);

  return status.toString();
}

async function transferNFT(
  client,
  tokenId,
  serialNumber,
  nftOwnerId,
  nftReceiverId,
  nftReceiverKey
) {
  const tx = new TransferTransaction()
    .addNftTransfer(tokenId, serialNumber, nftOwnerId, nftReceiverId)
    .freezeWith(client);

  const signedTx = await tx.sign(nftReceiverKey);

  const txResp = await signedTx.execute(client);

  const { status } = await txResp.getReceipt(client);

  return status.toString();
}

async function mintNFT(client, tokenId, supplyKey, metadataArray) {
  const tx = new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata(metadataArray)
    .freezeWith(client);

  const signedTx = await tx.sign(supplyKey);

  const txResp = await signedTx.execute(client);

  const { status } = await txResp.getReceipt(client);

  return status.toString();
}

async function updateNFTMemo(client, adminKey, tokenId, newMemo) {
  const tx = new TokenUpdateTransaction()
    .setTokenId(tokenId)
    .setAdminKey(adminKey)
    .setTokenMemo(newMemo)
    .freezeWith(client);

  const signedTx = await tx.sign(adminKey);

  const txResp = await signedTx.execute(client);

  const { status } = await txResp.getReceipt(client);

  return status.toString();
}

async function createNFT(
  client,
  adminKey,
  feeScheduleKey,
  supplyKey,
  memo,
  treasuryAccId,
  customFees
) {
  const tx = new TokenCreateTransaction()
    .setAdminKey(adminKey)
    .setTokenName('DroidZed NFT Collection')
    .setTokenMemo(memo)
    .setTokenSymbol('DRZ')
    .setTreasuryAccountId(treasuryAccId)
    .setTokenType(TokenType.NonFungibleUnique)
    .setCustomFees(customFees)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(250)
    .setSupplyKey(supplyKey)
    .setFeeScheduleKey(feeScheduleKey)
    .setMaxTransactionFee(100000)
    .freezeWith(client);

  const signedTx = await tx.sign(adminKey);

  const txResp = await signedTx.execute(client);

  const { tokenId, status } = await txResp.getReceipt(client);

  return { tokenId, status: status.toString() };
}

async function createAccount(client, adminKey, accountPrivKey) {
  //Create the transaction
  const tx = new AccountCreateTransaction()
    .setKey(accountPrivKey.publicKey)
    .setInitialBalance(Hbar.fromTinybars(1000))
    .freezeWith(client);

  const signedTx = await tx.sign(adminKey);

  const txResp = await signedTx.execute(client);

  const { accountId, status } = await txResp.getReceipt(client);

  return { accountId, status: status.toString() };
}

function generateRoyaltyFee(adminId, numerator, denominator) {
  //Create a royalty fee
  return new CustomRoyaltyFee()
    .setNumerator(numerator)
    .setDenominator(denominator)
    .setFeeCollectorAccountId(adminId)
    .setFallbackFee(
      new CustomFixedFee()
        .setHbarAmount(new Hbar(1))
        .setFeeCollectorAccountId(adminId)
    );
}

main().catch((err) => {
  console.error(err);
  process.exit(-1);
});

// @ts-nocheck
import {
  AccountBalanceQuery,
  AccountCreateTransaction,
  AccountId,
  Client,
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
  const myAccountId = AccountId.fromString(ACC_ID);
  const myAccountKey = PrivateKey.fromString(PRIV_KEY);

  const client = Client.forTestnet();
  client.setOperator(myAccountId, myAccountKey);

  //Create 2 new accounts
  const account1pvk = await PrivateKey.generateED25519();
  const account1pbk = account1pvk.publicKey;
  const account1T = await new AccountCreateTransaction()
    .setKey(account1pbk)
    .setInitialBalance(new Hbar(1000))
    .execute(client);

  const rec1 = await account1T.getReceipt(client);
  const account1 = rec1.accountId;
  console.log('First account', account1);

  const account2pvk = await PrivateKey.generateED25519();
  const account2pbk = account2pvk.publicKey;
  const account2T = await new AccountCreateTransaction()
    .setKey(account2pbk)
    .setInitialBalance(new Hbar(1000))
    .execute(client);

  const rec2 = await account2T.getReceipt(client);
  const account2 = rec2.accountId;

  //Create an NFT collection

  const royaltyFee = new CustomRoyaltyFee()
    .setNumerator(1)
    .setDenominator(10)
    .setFeeCollectorAccountId(myAccountId);

  const customFee = [royaltyFee];

  const nftCreate = await new TokenCreateTransaction()
    .setTokenName('DroidZed NFT Collection')
    .setTokenSymbol('Light')
    .setTreasuryAccountId(myAccountId)
    .setTokenType(TokenType.NonFungibleUnique)
    .setCustomFees(customFee)
    .setTokenMemo('The best collection in the NFTverse.')
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(250)
    .setSupplyKey(myAccountKey)
    .setFeeScheduleKey(myAccountKey)
    .setMaxTransactionFee(100000)
    .freezeWith(client);

  const nftCreateTxSign = await nftCreate.sign(myAccountKey);
  const nftCreateSubmit = await nftCreateTxSign.execute(client);
  const nftCreateRx = await nftCreateSubmit.getReceipt(client);

  //Display NFT collection information
  const tokenInfo = await new TokenInfoQuery()
    .setTokenId(nftCreateRx.tokenId)
    .execute(client);

  console.log(`Token info: ${tokenInfo}`);

  //Update the NFT collection memo
  const newMemo = 'Lightency collection.';
  const nftUpdate = await new TokenUpdateTransaction()
    .setTokenId(nftCreateRx.tokenId)
    .setTokenMemo(newMemo)
    .freezeWith(client);

  const nftUpdateTxSign = await nftUpdate.sign(myAccountKey);
  const nftUpdateSubmit = await nftUpdateTxSign.execute(client);
  await nftUpdateSubmit.getReceipt(client);

  const tokenInfo2 = await new TokenInfoQuery()
    .setTokenId(nftCreateRx.tokenId)
    .execute(client);
  console.log('NFT infos 2.0', tokenInfo2);

  const metadataString = 'NFT1';
  const encoder = new TextEncoder();
  const metadataUint8Array = encoder.encode(metadataString);

  const nftMint = await new TokenMintTransaction()
    .setTokenId(nftCreateRx.tokenId)
    .setMetadata([metadataUint8Array])
    .freezeWith(client);

  const nftMintTxSign = await nftMint.sign(myAccountKey);
  const nftMintSubmit = await nftMintTxSign.execute(client);
  await nftMintSubmit.getReceipt(client);

  const nftAssociate = await new TokenAssociateTransaction()
    .setAccountId(account1)
    .setTokenIds([nftCreateRx.tokenId])
    .freezeWith(client);

  const nftAssociateTxSign = await nftAssociate.sign(account1pvk);
  const nftAssociateSubmit = await nftAssociateTxSign.execute(client);
  await nftAssociateSubmit.getReceipt(client);

  //Transfer
  const nftTransfer = await new TransferTransaction()
    .addNftTransfer(nftCreateRx.tokenId, 1, myAccountId, account1)
    .freezeWith(client);

  const nftTransferTxSign = await nftTransfer.sign(myAccountKey);
  const nftTransferSubmit = await nftTransferTxSign.execute(client);
  await nftTransferSubmit.getReceipt(client);

  //Display account balances
  const accountBalances1 = await new AccountBalanceQuery()
    .setAccountId(myAccountId)
    .execute(client);

  console.log(accountBalances1.tokens.toString());

  const accountBalances2 = await new AccountBalanceQuery()
    .setAccountId(account1)
    .execute(client);
  console.log('balance 1', accountBalances2.tokens.toString());

  const accountBalances3 = await new AccountBalanceQuery()
    .setAccountId(account2)
    .execute(client);
  console.log('balance 2', accountBalances3.tokens.toString());

  //Modify custom fees
  const newRoyaltyFee = new CustomRoyaltyFee()
    .setNumerator(1)
    .setDenominator(5)
    .setFeeCollectorAccountId(myAccountId);

  const newCustomFee = [newRoyaltyFee];

  const nftUpdateFee = await new TokenFeeScheduleUpdateTransaction()
    .setTokenId(nftCreateRx.tokenId)
    .setCustomFees(newCustomFee)
    .freezeWith(client);

  const nftUpdateFeeTxSign = await nftUpdateFee.sign(myAccountKey);
  const nftUpdateFeeSubmit = await nftUpdateFeeTxSign.execute(client);
  await nftUpdateFeeSubmit.getReceipt(client);

  //Mint NFT2
  const metadata2String = 'Lightency NFT 1';
  const metadataUint8Array2 = encoder.encode(metadata2String);

  const nft2Mint = await new TokenMintTransaction()
    .setTokenId(nftCreateRx.tokenId)
    .setMetadata([metadataUint8Array2])
    .freezeWith(client);

  const nft2MintTxSign = await nft2Mint.sign(myAccountKey);
  const nft2MintSubmit = await nft2MintTxSign.execute(client);
  await nft2MintSubmit.getReceipt(client);
  console.log('NFT 2');

  //Associate account 2 with the NFT
  const nft2Associate = await new TokenAssociateTransaction()
    .setAccountId(account2)
    .setTokenIds([nftCreateRx.tokenId])
    .freezeWith(client);

  const nft2AssociateTxSign = await nft2Associate.sign(account2pvk);
  const nft2AssociateSubmit = await nft2AssociateTxSign.execute(client);
  await nft2AssociateSubmit.getReceipt(client);

  //Transfer the second NFT
  const nft2Transfer = await new TransferTransaction()
    .addNftTransfer(nftCreateRx.tokenId, 2, myAccountId, account2)
    .freezeWith(client);

  const nft2TransferTxSign = await nft2Transfer.sign(myAccountKey);
  const nft2TransferSubmit = await nft2TransferTxSign.execute(client);
  await nft2TransferSubmit.getReceipt(client);

  //Display updated account balances
  const accountBalances4 = await new AccountBalanceQuery()
    .setAccountId(myAccountId)
    .execute(client);
  console.log(accountBalances4.tokens.toString());

  const accountBalances5 = await new AccountBalanceQuery()
    .setAccountId(account1)
    .execute(client);
  console.log(accountBalances5.tokens.toString());

  const accountBalances6 = await new AccountBalanceQuery()
    .setAccountId(account2)
    .execute(client);
  console.log(accountBalances6.tokens.toString());

  client.close();
}

main().catch((err) => {
  console.error(err);
});

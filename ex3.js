/**
Exercise 3: Smart contract service
You'll need to create an account in addition to your testnet account.
Using the : 
HelloHedera.sol (This smart contract allows you to store and change the address of an account)
HelloHedera.json (compiled contract)
And using the smart contract service:
Deploy the smart contract on Hedera (using ContractCreateFlow() and bytecode)
Call the get_address function and display the address of your testnet account.
Call the set_address function, specifying the address of the new account.
Call the get_address function again to check that the address has been modified

 */

import { readFileSync } from 'fs';
import {
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractCreateFlow,
  ContractFunctionParameters,
  AccountId,
  Hbar,
  PrivateKey,
  EvmAddress,
  ContractInfoQuery,
} from '@hashgraph/sdk';

import { ACC_ID, PRIV_KEY } from './config/env.js';

async function main() {
  // Read the compiled contract bytecode and ABI
  const contractData = readFileSync('HelloHedera.json', 'utf-8');
  const { bytecode, abi } = JSON.parse(contractData);

  const operatorID = AccountId.fromString(ACC_ID);
  const operatorKey = PrivateKey.fromString(PRIV_KEY);

  const client = Client.forTestnet().setOperator(operatorID, operatorKey);

  const { contractId, status } = await deployContract(
    client,
    operatorKey,
    bytecode
  );

  console.log(`>> Contract creation status: ${status}\n`);

  const contractInfo = await getContractInfo(client, contractId);

  console.log(`>> My contract's info: ${JSON.stringify(contractInfo)}\n`);

  const currentAddr = await getAddress(client, contractId);

  console.log(`>> Current address: ${currentAddr}\n`);

  const setAddrStatus = await setAddress(
    client,
    contractId,
    '0x98e268680db0ff02dfa8131a4074893c464aaaaa',
    operatorKey
  );

  console.log(`>> Address update status: ${setAddrStatus}\n`);

  const newAddr = await getAddress(client, contractId);

  console.log(`>> New address: ${newAddr}\n`);

  console.log('============== FIN ===========');

  client.close();

  return;
}

async function deployContract(client, adminKey, byteCode) {
  const txResp = await new ContractCreateFlow()
    .setAdminKey(adminKey)
    .setBytecode(byteCode)
    .setConstructorParameters(
      new ContractFunctionParameters().addAddress(
        EvmAddress.fromString('0x98e268680db0ff02dfa8131a4074893c464aeacd')
      )
    )
    .setGas(100_000)
    .sign(adminKey)
    .execute(client);

  const txReceipt = await txResp.getReceipt(client);

  return { contractId: txReceipt.contractId, status: txReceipt.status };
}

async function getContractInfo(client, contractId) {
  return await new ContractInfoQuery()
    .setContractId(contractId)
    .execute(client);
}

async function getAddress(client, contractId) {
  const txRes = await new ContractCallQuery()
    .setContractId(contractId)
    .setGas(210_000)
    .setFunction('get_address')
    .execute(client);

  return txRes.getAddress();
}

async function setAddress(client, contractId, newAddress, adminKey) {
  const tx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100_000)
    .setFunction(
      'set_address',
      new ContractFunctionParameters().addAddress(
        EvmAddress.fromString(newAddress)
      )
    )
    .freezeWith(client)
    .sign(adminKey);

  const txResp = await tx.execute(client);

  const txReceipt = await txResp.getReceipt(client);

  return txReceipt.status;
}

main()
  .then()
  .catch((err) => {
    console.error(err);
    process.exit(-1);
  });

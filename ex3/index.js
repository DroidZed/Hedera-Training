import { readFileSync } from 'fs';
import {
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractCreateFlow,
  ContractFunctionParameters,
  AccountId,
  PrivateKey,
} from '@hashgraph/sdk';

import { ACC_ID, PRIV_KEY } from './config/env.js';

// Read the compiled contract bytecode and ABI
const contractData = readFileSync('HelloHedera.json', 'utf-8');
const { bytecode, abi } = JSON.parse(contractData);

async function main() {
  const myAccountId = AccountId.fromString(ACC_ID);
  const myPrivateKey = PrivateKey.fromString(PRIV_KEY);

  const client = Client.forTestnet();
  client.setOperator(myAccountId, myPrivateKey);

  if (!client) {
    return;
  }

  const contractID = await deployContract(client);

  if (!contractID) {
    return;
  }

  await callGetAddress(client, contractID.toString());

  await callSetAddress(
    client,
    contractID.toString(),
    '0x98e268680db0ff02dfa8131a4074893c464aaaaa'
  );

  await callGetAddress(client, contractID.toString());

  client.close();
}

async function deployContract(client) {
  const contractCreate = new ContractCreateFlow()
    .setGas(100_000)
    .setConstructorParameters(
      new ContractFunctionParameters().addAddress(
        '0x98e268680db0ff02dfa8131a4074893c464aeacd'
      )
    )
    .setBytecode(bytecode);

  const txResponse = await contractCreate.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const newContractId = receipt.contractId;

  console.log(`The new contract id is ${newContractId}`);
  return newContractId;
}

async function callSetAddress(client, contractId, newAddress) {
  const contractExecTx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setFunction(
      'set_address',
      new ContractFunctionParameters().addAddress(newAddress)
    );

  const submitExecTx = await contractExecTx.execute(client);
  const receipt = await submitExecTx.getReceipt(client);

  console.log('The transaction status is ' + receipt.status.toString());
}

async function callGetAddress(client, contractId) {
  const getAddress = new ContractCallQuery()
    .setContractId(contractId)
    .setGas(210_000)
    .setFunction('get_address');

  const contractCallResult = await getAddress.execute(client);
  const address = contractCallResult.getAddress();

  console.log('Address:', address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

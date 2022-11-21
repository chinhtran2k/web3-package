import { TransactionReceipt } from "web3-core";
import Web3 from "web3";
import { BlockNumber } from "web3-core/types";
import {
  BlockTransactionString,
  Transaction,
  BlockHeader,
} from "web3-eth/types";

const Web3Client = require("web3");
interface IBLock extends BlockHeader {
  transactions: Transaction[] | string[];
}

class Connection {
  web3: Web3;
  web3WS: Web3;

  constructor(provider: string, providerWs?: string) {
    const web3 = new Web3Client(provider);
    this.web3 = web3;
    if (providerWs) {
      const web3WS = new Web3Client(providerWs);
      this.web3WS = web3WS;
    }
  }

  async getBlock(
    blockHashOrBlockNumber: string | BlockNumber
  ): Promise<BlockTransactionString> {
    return await this.web3.eth.getBlock(blockHashOrBlockNumber);
  }

  async getTransactionData(transactionHash: string): Promise<Transaction> {
    return await this.web3.eth.getTransaction(transactionHash);
  }

  async getTransactionReceipt(
    transactionHash: string
  ): Promise<TransactionReceipt> {
    return await this.web3.eth.getTransactionReceipt(transactionHash);
  }

  onPendingTransaction(onData: (transaction: string) => void) {
    const subscription = this.web3WS.eth
      .subscribe("pendingTransactions", function (error, result) {
        if (!error) console.log(result);
      })
      .on("data", onData);
    return subscription;
  }

  onBlock(onData: (block: IBLock) => void) {
    const subscription = this.web3WS.eth
      .subscribe("newBlockHeaders", function (error, result) {
        // if (!error) console.log(result);
      })
      .on("connected", function (subscriptionId) {
        // console.log(subscriptionId);
      })
    //   .on("data", onData)
      .on("error", console.error);
    return subscription;
  }
}

export { Connection };

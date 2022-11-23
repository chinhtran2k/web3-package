import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class ERC20Proxy {
  private connection: Connection;
  private erc20Proxy: Contract;
  private claimHolder: Contract;
  constructor(connection: Connection) {
    this.connection = connection;
    this.erc20Proxy = new this.connection.web3.eth.Contract(
      CONFIG.ERC20Proxy.abi,
      CONFIG.ERC20Proxy.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi,
      CONFIG.ClaimHolder.address
    );
  }
  public async setAwardValue(value: number, privateKey: string) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiMint = this.erc20Proxy.methods.setAwardValue(value).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiMint,
      CONFIG.ERC20Proxy.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.ERC20Proxy.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    return { receipt, eventLogs };
  }

  public async setTokenOwner(tokenOwner: string, privateKey: string) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiSetTOkenOwner = this.erc20Proxy.methods
      .setTokenOwner(tokenOwner)
      .encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiSetTOkenOwner,
      CONFIG.ERC20Proxy.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.ERC20Proxy.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    return { receipt, eventLogs };
  }

  public async setPCOToken(pcoAddress: string, privateKey: string) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiSetPCOToken = this.erc20Proxy.methods
      .setPCOToken(pcoAddress)
      .encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiSetPCOToken,
      CONFIG.ERC20Proxy.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.ERC20Proxy.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    return { receipt, eventLogs };
  }

  public async setDDRContract(ddrAddress: string, privateKey: string) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiSetDDRContract = this.erc20Proxy.methods
      .setDDRContract(ddrAddress)
      .encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiSetDDRContract,
      CONFIG.ERC20Proxy.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.ERC20Proxy.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    return { receipt, eventLogs };
  }

  public async awardToken(to: string, privateKey: string) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiAwardToken = this.erc20Proxy.methods.awardToken(to).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiAwardToken,
      CONFIG.ERC20Proxy.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.ERC20Proxy.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    return { receipt, eventLogs };
  }
}

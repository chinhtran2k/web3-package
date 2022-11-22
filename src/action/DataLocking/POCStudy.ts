import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { ClaimTypes } from "../../types/AuthType";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class POCStudy {
  private connection: Connection;
  private pcoStudy: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.pcoStudy = new this.connection.web3.eth.Contract(
      CONFIG.POCStudy.abi,
      CONFIG.POCStudy.address
    );
  }
  public async mintPOCStudy(uri: string, message: string, privateKey: string) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var mintAbi = this.pcoStudy.methods.mint(uri, message).encodeABI();
    const tx = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.POCStudy.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(tx.logs, CONFIG.POCStudy.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    return { tx, eventLogs };
  }

  public async getRootHashPOCPatient() {
    var RootHashPOCPatient = this.pcoStudy.methods
      .getRootHashPOCPatient()
      .call();
    return RootHashPOCPatient;
  }

  public async getRootNodeIdPOCPatient() {
    var RootNodeIdPOCPatient = this.pcoStudy.methods
      .getRootNodeIdPOCPatient()
      .call();
    return RootNodeIdPOCPatient;
  }
}

import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
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
  public async mintPOCStudy(
    uri: string,
    message: string,
    privateKey: string,
    nonce?: number
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    if (!nonce) {
      var nonce = await this.connection.web3.eth.getTransactionCount(
        account.address
      );
    }

    var mintAbi = this.pcoStudy.methods.mint(uri, message).encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.POCStudy.address,
      privateKey,
      nonce
    );

    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.POCStudy.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "LockedPOCPatient"
    );
    let tokenId = eventMintDDR[0].events.pocTokenId;

    return { receipt, eventLogs, tokenId };
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

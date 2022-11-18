import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { ClaimTypes } from "../../types/AuthType";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class POCStudy {
  private connection: Connection;
  private pcoStudy: Contract;
  private claimHolder: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.pcoStudy = new this.connection.web3.eth.Contract(
      CONFIG.POCStudy.abi,
      CONFIG.Patient.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(CONFIG.ClaimHolder.abi);
  }
  public async mintPOCStudy(
    uri: string,
    level: number,
    privateKey: string
  ){
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiMint = this.pcoStudy.methods.mint(uri, level).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiMint,
      CONFIG.DDR.address,
      privateKey,
      nonce,
    );
    const decodedLogs = await decodeLogs(receipt.logs, CONFIG.POCStudy.abi);
    const eventLogs = await decodedLogs.filter(
      (log: any) => log.name === "LockedPOCPatient",
    );
    return { receipt, eventLogs };
  }

  public async getRootHashPOCPatient(){
    var RootHashPOCPatient = this.pcoStudy.methods.getRootHashPOCPatient().call();
    return RootHashPOCPatient;
  }

  public async getRootNodeIdPOCPatient(){
    var RootNodeIdPOCPatient = this.pcoStudy.methods.getRootNodeIdPOCPatient().call();
    return RootNodeIdPOCPatient;
  }
}
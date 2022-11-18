import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { ClaimTypes } from "../../types/AuthType";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class DDR {
  private connection: Connection;
  private ddr: Contract;
  private claimHolder: Contract;
  private authenticator: any;

  constructor(connection: Connection) {
    this.connection = connection;
    this.ddr = new this.connection.web3.eth.Contract(
      CONFIG.DDR.abi,
      CONFIG.DDR.address
    );
    this.authenticator = new connection.web3.eth.Contract(
      CONFIG.Authenticator.abi,
      CONFIG.Authenticator.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(CONFIG.ClaimHolder.abi);
  }

  public async createAuthentication(
    identity: string,
  ){
    var abicreateAuthentication = this.authenticator.methods.createAuthentication(identity).call();
    return abicreateAuthentication;
  }

  public async mintDDR(
    hashedData: string,
    ddrRawId: string,
    ddrPatientRawId: string,
    uri: string,
    patientDID: string,
    privateKey: string
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var mintAbi = await this.ddr.methods
      .mint(hashedData, ddrRawId,ddrPatientRawId, uri, patientDID)
      .encodeABI();

    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.DDR.address, 0, mintAbi)
      .encodeABI();

    const tx = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
    );
    const decodedLogs = await decodeLogs(tx.logs, CONFIG.ClaimHolder.abi);
    const eventLogs = await decodedLogs.filter(
      // (log: any) => log.name === "MintedDDR",
      // (log: any) => log.name === "ApprovalShareDDR",
      // (log: any) => log.name === "DDRTokenLocked"
      (log: any) => log.name === "ExecutionRequested"
    );
    return { tx, eventLogs};
  }
  public async mintBatchDDR(
    hashValues: any[],
    ddrRawIds: string[],
    uris: string[],
    patientDID: string,
    privateKey: string
  ){
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiMintBatch = this.ddr.methods.mintBatch(hashValues, ddrRawIds, uris, patientDID).encodeABI();
    var abiMintBatchExecute = this.claimHolder.methods.execute(CONFIG.ClaimHolder.address,0,abiMintBatch).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiMintBatchExecute,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce,
    );
    return receipt;
  }

  public async SharedDDR(
    ddrTokenId: number,
    patientDID: string,
    privateKey: string
  ){
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiMintBatch = this.ddr.methods.shareDDR(ddrTokenId, patientDID).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiMintBatch,
      CONFIG.DDR.address,
      privateKey,
      nonce,
    );
    const decodedLogs = await decodeLogs(receipt.logs, CONFIG.DDR.abi);
    const eventLogs = await decodedLogs.filter(
      (log: any) => log.name === "ApprovalShareDDR",
    );
    return { receipt, eventLogs };
  }

  public async disclosureConsentDDRFromHospital(
    ddrTokenIds: number[],
    hospitalDID: string,
    privateKey: string
  ){
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiLockDDR= this.ddr.methods.disclosureConsentDDRFromHospital(ddrTokenIds, hospitalDID).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiLockDDR,
      CONFIG.DDR.address,
      privateKey,
      nonce,
    );
    const decodedLogs = await decodeLogs(receipt.logs, CONFIG.DDR.abi);
    const eventLogs = await decodedLogs.filter(
      (log: any) => log.name === "ApprovalDisclosureConsentDDR",
    );
    return { receipt, eventLogs };
  }
}
import { stringify, StringifyOptions } from "querystring";
import { CONFIG } from "../config";
import { Connection, signAndSendTransaction, soliditySha3 } from "../utils";
const { decodeLogs } = require("abi-parser-pack");

class Integrity {
  private connection: Connection;
  private ddr: any;
  private patient: any;
  private Authenticator: any;
  private AuthenticatorHelper: any;
  private POCStudy: any;
  private claimHoder: any;
  constructor(connection: Connection) {
    this.connection = connection;
    this.claimHoder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi,
      CONFIG.ClaimHolder.address
    );
    this.ddr = new this.connection.web3.eth.Contract(
      CONFIG.DDR.abi,
      CONFIG.DDR.address
    );
    this.patient = new connection.web3.eth.Contract(
      CONFIG.Patient.abi,
      CONFIG.Patient.address
    );
    this.Authenticator = new connection.web3.eth.Contract(
      CONFIG.Authenticator.abi,
      CONFIG.Authenticator.address
    );
    this.AuthenticatorHelper = new connection.web3.eth.Contract(
      CONFIG.AuthenticatorHelper.abi,
      CONFIG.AuthenticatorHelper.address
    )
    this.POCStudy = new connection.web3.eth.Contract(
      CONFIG.POCStudy.abi,
      CONFIG.POCStudy.address
    )
  }

  public async createAuthentication(
    identity: string,
  ){
    var abicreateAuthentication = this.Authenticator.methods.createAuthentication(identity).call();
    return abicreateAuthentication;
  }

  public async mintDDR(
    hashValue: any,
    ddrRawId: string,
    ddrPatientRawId: string,
    uri: string,
    patientDID: string,
    privateKey: string
  ){
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiMint = this.ddr.methods.mint(hashValue, ddrRawId, ddrPatientRawId, uri, patientDID).encodeABI();
    var abiMintExecute = this.claimHoder.methods.execute(CONFIG.DDR.address,0,abiMint).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiMintExecute,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );
    const decodedLogs = await decodeLogs(receipt.logs, CONFIG.DDR.abi);
    const eventLogs = await decodedLogs.filter(
      (log: any) => log.name === "MintedDDR",
      (log: any) => log.name === "ApprovalShareDDR",
      (log: any) => log.name === "DDRTokenLocked"
    );
    return { receipt, eventLogs};
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
    var abiMintBatchExecute = this.claimHoder.methods.execute(CONFIG.ClaimHolder.address,0,abiMintBatch).encodeABI();
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

/*------------------------------------------------------------*/

  public async mintPatient(
    patientDID: string,
    uri: string,
    privateKey: string
  ){
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var abiMint = this.patient.methods.mint(patientDID, uri).encodeABI();
    var abiMintExecute = this.claimHoder.methods.execute(CONFIG.ClaimHolder.address,0,abiMint).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      abiMintExecute,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce,
    );
    const decodedLogs = await decodeLogs(receipt.logs, CONFIG.Patient.abi);
    const eventLogs = await decodedLogs.filter(
      (log: any) => log.name === "PatientLockTokenMinted",
    );
    return { receipt, eventLogs };
  }

  public async getPatientRootHashValue(
    patientDID: string,
  ){
    var PatientRootHashValue = this.patient.methods.getPatientRootHashValue(patientDID).call();
    return PatientRootHashValue;
  }

  public async getListRootHashValue(){
    var listRootHashValue = this.patient.methods.getListRootHashValue().call();
    return listRootHashValue;
  }
/*-------------------------------------------*/

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
    var abiMint = this.POCStudy.methods.mint(uri, level).encodeABI();
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
    var RootHashPOCPatient = this.POCStudy.methods.getRootHashPOCPatient().call();
    return RootHashPOCPatient;
  }

  public async getRootNodeIdPOCPatient(){
    var RootNodeIdPOCPatient = this.POCStudy.methods.getRootNodeIdPOCPatient().call();
    return RootNodeIdPOCPatient;
  }
}

export { Integrity };
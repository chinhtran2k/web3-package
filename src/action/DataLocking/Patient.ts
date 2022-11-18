import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { ClaimTypes } from "../../types/AuthType";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class Patient {
  private connection: Connection;
  private patient: Contract;
  private claimHolder: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.patient = new this.connection.web3.eth.Contract(
      CONFIG.Patient.abi,
      CONFIG.Patient.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(CONFIG.ClaimHolder.abi);
  }
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
    var abiMintExecute = this.claimHolder.methods.execute(CONFIG.ClaimHolder.address,0,abiMint).encodeABI();
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
}
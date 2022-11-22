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
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
  }
  public async mintPatient(
    patientDID: string,
    uri: string,
    privateKey: string
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var mintAbi = this.patient.methods.mint(patientDID, uri).encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.Patient.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.Patient.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "PatientLockTokenMinted"
    );

    let tokenId = eventMintDDR[0].events.tokenId;

    return { receipt, eventLogs, tokenId };
  }

  public async getPatientRootHashValue(patientDID: string) {
    var PatientRootHashValue = this.patient.methods
      .getPatientRootHashValue(patientDID)
      .call();
    return PatientRootHashValue;
  }

  public async getListRootHashValue() {
    var listRootHashValue = this.patient.methods.getListRootHashValue().call();
    return listRootHashValue;
  }
}

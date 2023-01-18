import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
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
    privateKey: string,
    nonce?: number,
    isSimulate?: boolean
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    // add nonce if not exist
    if (!nonce) {
      var nonce = await this.connection.web3.eth.getTransactionCount(
        account.address
      );
    }

    var mintAbi = await this.patient.methods.mint(patientDID, uri).encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.Patient.address,
      privateKey,
      nonce,
      isSimulate!
    );

    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.Patient.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "PatientLockTokenMinted"
    );
    let tokenId = eventMintDDR[0].events.patientTokenId;
    let hashValue = eventMintDDR[0].events.rootHash;

    return { receipt, eventLogs, tokenId, hashValue };
  }

  public async getHashClaim(patientDID: string) {
    var hashClaim = await this.patient.methods.getPatientRootHashValue(patientDID).call();
    return hashClaim;
  }

  public async getPatientRootHashValue(patientDID: string) {
    var PatientRootHashValue = await this.patient.methods
      .getPatientRootHashValue(patientDID)
      .call();
    return PatientRootHashValue;
  }

  public async getListRootHashValue() {
    let listAddress = await this.patient.methods
      .getListAddressPatient()
      .call();
    let listPatientLocks = Array<any>();
    for (let i = 0; i < listAddress.length; i++) {
      let hashvalue = await this.patient.methods
        .getPatientRootHashValue(listAddress[i])
        .call();
        listPatientLocks.push(hashvalue);
    }
    return listPatientLocks;
  }

  public async getListAddressPatient() {
    var listRootHashValue = await this.patient.methods
      .getListAddressPatient()
      .call();
    return listRootHashValue;
  }
}

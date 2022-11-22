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
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
  }

  public async createAuthentication(identity: string) {
    var abicreateAuthentication = this.authenticator.methods
      .createAuthentication(identity)
      .call();
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
      .mint(hashedData, ddrRawId, ddrPatientRawId, uri, patientDID)
      .encodeABI();

    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.DDR.address, 0, mintAbi)
      .encodeABI();

    console.log("claim holder", CONFIG.ClaimHolder.address);

    const tx = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );

    // Decode log for different contract
    const decodedLogsCL = await decodeLogs(
      tx.logs,
      CONFIG.ClaimHolder.abi.concat(CONFIG.DDR.abi)
    );
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    let tokenId = eventLogs[3].events.tokenId;
    let ddrs = [ tokenId, ddrRawId ]
    return { tx, eventLogs, ddrs};
  }
  public async mintBatchDDR(
    hashValues: any[],
    ddrRawIds: string[],
    ddrPatientRawIds: string[],
    uris: string[],
    patientDID: string,
    privateKey: string
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var mintBatchAbi = this.ddr.methods
      .mintBatch(hashValues, ddrRawIds, ddrPatientRawIds, uris, patientDID)
      .encodeABI();
    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.ClaimHolder.address, 0, mintBatchAbi)
      .encodeABI();
    const tx = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );
    return tx;
  }

  public async sharedDDR(
    ddrTokenId: number,
    patientDID: string,
    privateKey: string
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var sharedDDRAbi = this.ddr.methods
      .shareDDR(ddrTokenId, patientDID)
      .encodeABI();
    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.ClaimHolder.address, 0, sharedDDRAbi)
      .encodeABI();
    const tx = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(
      tx.logs,
      CONFIG.ClaimHolder.abi.concat(CONFIG.DDR.abi)
    );
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    return { tx, eventLogs };
  }

  public async disclosureConsentDDRFromProvider(
    ddrTokenIds: number[],
    providerDID: string,
    privateKey: string
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var lockDDRAbi = this.ddr.methods
      .disclosureConsentDDRFromProvider(ddrTokenIds, providerDID)
      .encodeABI();
    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.ClaimHolder.address, 0, lockDDRAbi)
      .encodeABI();
    const tx = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );
    const decodedLogsCL = await decodeLogs(
      tx.logs,
      CONFIG.ClaimHolder.abi.concat(CONFIG.DDR.abi)
    );
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    return { tx, eventLogs };
  }
}

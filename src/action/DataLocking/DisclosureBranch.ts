import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class DisclosureBranch {
  private connection: Connection;
  private disclosureDDR: Contract;
  private claimHolder: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.disclosureDDR = new this.connection.web3.eth.Contract(
      CONFIG.DisclosureBranch.abi,
      CONFIG.DisclosureBranch.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
  }
  public async mintDisclosureBranch(
    patientDID: string,
    providerDID: string,
    uri: string,
    privateKey: string,
    nonce?: number
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    // add nonce if not exist
    if (!nonce) {
      var nonce = await this.connection.web3.eth.getTransactionCount(
        account.address
      );
    }

    var mintAbi = this.disclosureDDR.methods
      .mint(patientDID, providerDID, uri)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.DisclosureBranch.address,
      privateKey,
      nonce
    );

    const decodedLogsCL = await decodeLogs(
      receipt.logs,
      CONFIG.DisclosureBranch.abi
    );
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "DisclosureLockTokenMinted"
    );
    let tokenId = eventMintDDR[0].events.tokenId;
    let hashValue = eventMintDDR[0].events.newHashValue;

    return { receipt, eventLogs, tokenId, hashValue };
  }

  public async getListRootHashDisclosure() {
    var ListRootHashValue = this.disclosureDDR.methods
      .getListRootHashDisclosure()
      .call();
    return ListRootHashValue;
  }

  public async getListHashDisclosureOfProvider(patientDID: string) {
    var listHashValue = this.disclosureDDR.methods
      .getListHashDisclosureOfProvider(patientDID)
      .call();
    return listHashValue;
  }

  public async getListTokenId(patientDID: string) {
    var listTokenId = this.disclosureDDR.methods
      .getListTokenId(patientDID)
      .call();
    return listTokenId;
  }

  public async getAllHashDisclosureBranchOfPatient(patientDID: string) {
    let tokenIds = await this.disclosureDDR.methods
      .getListTokenId(patientDID)
      .call();
    let disclosureBranch = Array<any>();
    for (let i = 0; i < tokenIds.length; i++) {
      let hashvalue = await this.disclosureDDR.methods
        .getTokenIdRootHashDisclosure(parseInt(tokenIds[i]))
        .call();
      disclosureBranch.push(hashvalue);
    }
    return disclosureBranch;
  }
}

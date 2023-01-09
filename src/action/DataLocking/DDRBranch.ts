import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class DDRBranch {
  private connection: Connection;
  private ddrBranch: Contract;
  private claimHolder: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.ddrBranch = new this.connection.web3.eth.Contract(
      CONFIG.DDRBranch.abi,
      CONFIG.DDRBranch.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
  }
  public async mintDDRBranch(
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

    var mintAbi = await this.ddrBranch.methods
      .mint(patientDID, uri)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.DDRBranch.address,
      privateKey,
      nonce,
      isSimulate!
    );

    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.DDRBranch.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "DDRBranchLockTokenMinted"
    );
    let tokenId = eventMintDDR[0].events.tokenId;
    let hashValue = eventMintDDR[0].events.newHashValue;

    return { receipt, eventLogs, tokenId, hashValue };
  }

  public async getListRootHashDDR() {
    var ListRootHashValue = await this.ddrBranch.methods
      .getListRootHashDDR()
      .call();
    return ListRootHashValue;
  }

  public async getAllHashDDROfPatient(patientDID: string) {
    let tokenIds = await this.ddrBranch.methods
      .getListTokenId(patientDID)
      .call();
    let ddrBranch = Array<any>();
    for (let i = 0; i < tokenIds.length; i++) {
      let hashvalue = await this.ddrBranch.methods
        .getTokenIdRootHashDDR(parseInt(tokenIds[i]))
        .call();
      ddrBranch.push(hashvalue);
    }
    return ddrBranch;
  }

  public async getListTokenId(patientDID: string) {
    var listTokenId = await this.ddrBranch.methods
      .getListTokenId(patientDID)
      .call();
    return listTokenId;
  }
}

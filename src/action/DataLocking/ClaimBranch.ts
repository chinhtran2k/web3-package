import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class ClaimBranch {
  private connection: Connection;
  private claimBranch: Contract;
  private claimHolder: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.claimBranch = new this.connection.web3.eth.Contract(
      CONFIG.ClaimBranch.abi,
      CONFIG.ClaimBranch.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
  }
  public async mintClaimBranch(
    accountDID: string,
    accountId: string,
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

    var mintAbi = await this.claimBranch.methods
      .mint(accountDID, accountId, uri)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.ClaimBranch.address,
      privateKey,
      nonce,
      isSimulate!
    );

    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.ClaimBranch.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "ClaimLockTokenMinted"
    );
    let tokenId = eventMintDDR[0].events.tokenId;
    let hashValue = eventMintDDR[0].events.hashValue;

    return { receipt, eventLogs, tokenId, hashValue };
  }

  public async getHashDataClaim(accountDID: string) {
    var hashClaim = await this.claimBranch.methods.getHashClaim(accountDID).call();
    return hashClaim;
  }

  public async getHashValueClaim(accountDID: string) {
    var claimRootHashValue = await this.claimBranch.methods
      .getHashValueClaim(accountDID)
      .call();
    return claimRootHashValue;
  }

  public async getListHashValue() {
    var listHashValue = await this.claimBranch.methods.getListHashValue().call();
    return listHashValue;
  }

  public async getListAddressOfclaim() {
    var listHashValue = await this.claimBranch.methods.getListAddressOfclaim().call();
    return listHashValue;
  }

  public async getListAddressOfClaim() {
    var listAddressOfClaim = await this.claimBranch.methods
      .getListAddressOfClaim()
      .call();
    return listAddressOfClaim;
  }
}

import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class Claim {
  private connection: Connection;
  private claim: Contract;
  private claimHolder: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.claim = new this.connection.web3.eth.Contract(
      CONFIG.Claim.abi,
      CONFIG.Claim.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
  }
  public async mintClaim(
    accountDID: string,
    accountId: string,
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

    var mintAbi = this.claim.methods
      .mint(accountDID, accountId, uri)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.Claim.address,
      privateKey,
      nonce
    );

    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.Claim.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "ClaimLockTokenMinted"
    );
    let tokenId = eventMintDDR[0].events.tokenId;
    let hashValue = eventMintDDR[0].events.hashValue;

    return { receipt, eventLogs, tokenId, hashValue };
  }

  public async getHashDataClaim(accountDID: string) {
    var hashClaim = this.claim.methods.getHashClaim(accountDID).call();
    return hashClaim;
  }

  public async getHashValueClaim(accountDID: string) {
    var claimRootHashValue = this.claim.methods
      .getHashValueClaim(accountDID)
      .call();
    return claimRootHashValue;
  }

  public async getListHashValue() {
    var listHashValue = this.claim.methods.getListHashValue().call();
    return listHashValue;
  }

  public async getListAddressOfclaim() {
    var listHashValue = this.claim.methods.getListAddressOfclaim().call();
    return listHashValue;
  }

  public async getListAddressOfClaim() {
    var listAddressOfClaim = this.claim.methods.getListAddressOfClaim().call();
    return listAddressOfClaim;
  }
}

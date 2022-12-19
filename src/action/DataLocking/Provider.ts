import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class Provider {
  private connection: Connection;
  private provider: Contract;
  private claimHolder: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.provider = new this.connection.web3.eth.Contract(
      CONFIG.Provider.abi,
      CONFIG.Provider.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
  }
  public async mintProvider(
    providerDID: string,
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

    var mintAbi = this.provider.methods
      .mint(providerDID, accountId, uri)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.Provider.address,
      privateKey,
      nonce
    );

    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.Provider.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "ProviderLockTokenMinted"
    );
    let tokenId = eventMintDDR[0].events.providerTokenId;
    let hashValue = eventMintDDR[0].events.rootHash;

    return { receipt, eventLogs, tokenId, hashValue };
  }

  public async getHashClaim(providerDID: string){
    var hashClaim = this.provider.methods
      .getHashClaim(providerDID)
      .call();
    return hashClaim;
  }

  public async getListTokenIdProvider() {
    var PatientRootHashValue = this.provider.methods
      .getListTokenIdProvider()
      .call();
    return PatientRootHashValue;
  }

  public async getListAddressOfProvider() {
    var PatientRootHashValue = this.provider.methods
      .getListAddressOfProvider()
      .call();
    return PatientRootHashValue;
  }

  public async getListHashValueProvider(providerDID: string) {
    var listRootHashValue = this.provider.methods
      .getHashValueProvider(providerDID)
      .call();
    return listRootHashValue;
  }

}

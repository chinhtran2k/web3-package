import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
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

  public async mintDDR(
    hashedData: string,
    ddrRawId: string,
    ddrPatientRawId: string,
    uri: string,
    patientDID: string,
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
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );

    var mintAbi = await this.ddr.methods
      .mint(hashedData, ddrRawId, ddrPatientRawId, uri, patientDID)
      .encodeABI();
    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.DDR.address, 0, mintAbi)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );

    // Decode log for different contract
    const decodedLogsCL = await decodeLogs(
      receipt.logs,
      CONFIG.ClaimHolder.abi.concat(CONFIG.DDR.abi)
    );
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "MintedDDR"
    );

    let tokenId = eventMintDDR[0].events.tokenId;
    let hashValue = eventMintDDR[0].events.hashValue;
    let ddrs = Array<any>();
    ddrs.push({
      tokenId: tokenId,
      ddrRawId: ddrRawId,
      hashValue: hashValue,
    });
    return { receipt, eventLogs, ddrs };
  }

  public async mintBatchDDR(
    hashValues: any[],
    ddrRawIds: string[],
    ddrPatientRawIds: string[],
    uris: string[],
    patientDID: string,
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

    var mintBatchAbi = this.ddr.methods
      .mintBatch(hashValues, ddrRawIds, ddrPatientRawIds, uris, patientDID)
      .encodeABI();
    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.DDR.address, 0, mintBatchAbi)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );

    const decodedLogsCL = await decodeLogs(
      receipt.logs,
      CONFIG.ClaimHolder.abi.concat(CONFIG.DDR.abi)
    );
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "MintedBatchDDR"
    );

    let tokenId = eventMintDDR[0].events.tokenIds;
    let ddrRawId = ddrRawIds;
    let hashValue = eventMintDDR[0].events.hashValues;
    let ddrs = Array<any>();
    for (let i = 0; i < tokenId.length; i++) {
      ddrs.push({
        tokenId: tokenId[i],
        ddrRawId: ddrRawId[i],
        hashValue: hashValue[i],
      });
    }

    return { receipt, eventLogs, ddrs };
  }

  public async setERC20Proxy(
    addressErc20Proxy: string,
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

    var mintBatchAbi = this.ddr.methods
      .setERC20Proxy(addressErc20Proxy)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintBatchAbi,
      CONFIG.DDR.address,
      privateKey,
      nonce
    );

    return receipt;
  }

  public async sharedDDR(
    ddrTokenIds: number[],
    patientDID: string,
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

    var sharedDDRAbi = this.ddr.methods
      .shareDDR(ddrTokenIds, patientDID)
      .encodeABI();
    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.DDR.address, 0, sharedDDRAbi)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );

    // Decode log for different contract
    const decodedLogsCL = await decodeLogs(
      receipt.logs,
      CONFIG.ClaimHolder.abi
        .concat(CONFIG.DDR.abi)
        .concat(CONFIG.ERC20Proxy.abi)
    );
    let eventLogs = await decodedLogsCL.filter((log: any) => log);

    return { receipt, eventLogs };
  }

  public async disclosureConsentDDR(
    ddrTokenIds: number[],
    providerDID: string,
    patientDID: string,
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

    var lockDDRAbi = this.ddr.methods
      .disclosureConsentDDR(ddrTokenIds, providerDID)
      .encodeABI();
    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.DDR.address, 0, lockDDRAbi)
      .encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      executeAbi,
      patientDID,
      privateKey,
      nonce
    );

    const decodedLogsCL = await decodeLogs(
      receipt.logs,
      CONFIG.ClaimHolder.abi.concat(CONFIG.DDR.abi)
    );
    let eventLogs = await decodedLogsCL.filter((log: any) => log);

    return { receipt, eventLogs };
  }

  public async getShareDDR(patientDID: string, ddrTokenId: number) {
    var isSharedDDR = this.ddr.methods
      .isSharedDDR(patientDID, ddrTokenId)
      .call();
    return isSharedDDR;
  }

  public async getConsentedDDR(providerDID: string, ddrTokenId: number) {
    var isConsentedDDR = this.ddr.methods
      .isConsentedDDR(providerDID, ddrTokenId)
      .call();
    return isConsentedDDR;
  }

  public async getLockedDDR(ddrTokenId: number) {
    var isLockedDDR = this.ddr.methods.isLockedDDR(ddrTokenId).call();
    return isLockedDDR;
  }
}

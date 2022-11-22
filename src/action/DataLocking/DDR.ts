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
      .execute(CONFIG.DDR.address, 0, mintBatchAbi)
      .encodeABI();
    const receipt = await signAndSendTransaction(
      this.connection,
      executeAbi,
      CONFIG.ClaimHolder.address,
      privateKey,
      nonce
    );
    return receipt;
  }

  public async setERC20Proxy(addressErc20Proxy: string, privateKey: string) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    var nonce = await this.connection.web3.eth.getTransactionCount(
      account.address
    );
    var mintBatchAbi = this.ddr.methods
      .setERC20Proxy(addressErc20Proxy)
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
    return receipt;
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
      .execute(CONFIG.DDR.address, 0, sharedDDRAbi)
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
    return { receipt, eventLogs };
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
      .execute(CONFIG.DDR.address, 0, lockDDRAbi)
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
    return { receipt, eventLogs };
  }
}

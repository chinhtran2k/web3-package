import { CONFIG } from "../../config";
import { PreDefinedClaimKeys } from "../../types";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class DDR {
  private connection: Connection;
  private ddr: Contract;
  private claimHolder: Contract;
  private authenticator: Contract;

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
    hashedValue: string,
    ddrId: string,
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

    var mintAbi = await this.ddr.methods
      .mint(hashedValue, ddrId, uri, patientDID)
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

    if (eventMintDDR.length == 0) {
      return Error("Execution failed!");
    } else {
      let tokenId = eventMintDDR[0].events.tokenId;
      let hashValue = eventMintDDR[0].events.hashValue;
      let ddrs = Array<any>();
      ddrs.push({
        tokenId: tokenId,
        patientDID: patientDID,
        ddrId: ddrId,
        hashedValue: hashValue,
      });
      return { receipt, eventLogs, ddrs };
    }
  }

  public async mintBatchDDR(
    hashedValues: any[],
    ddrsIds: string[],
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
      .mintBatch(hashedValues, ddrsIds, uris, patientDID)
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
    if (eventMintDDR.length == 0) {
      return Error("Execution failed!");
    } else {
      let tokenId = eventMintDDR[0].events.tokenIds;
      let ddrId = ddrsIds;
      let hashValues = eventMintDDR[0].events.hashValues;
      let ddrs = Array<any>();
      for (let i = 0; i < tokenId.length; i++) {
        ddrs.push({
          tokenId: tokenId[i],
          patientDID: patientDID,
          ddrId: ddrId[i],
          hashedValue: hashValues[i],
        });
      }
      return { receipt, eventLogs, ddrs };
    }
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
    ddrIds: Array<string>,
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

    let ddrTokenIds = Array<number>();

    for (let i = 0; i < ddrIds.length; i++) {
      let ddrTokenId = await this.ddr.methods
        .getTokenIdOfPatientDIDByRawId(patientDID, ddrIds[i])
        .call();
      ddrTokenIds.push(ddrTokenId);
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

  public async getDDR(patientDID: string, ddrId: string) {
    let tokenId = await this.ddr.methods
      .getTokenIdOfPatientDIDByRawId(patientDID, ddrId)
      .call();
    let ddr = await this.ddr.methods.getToken(parseInt(tokenId)).call();
    return ddr;
  }

  public async getAllDDR(patientDID: string) {
    let tokenIds = await this.ddr.methods
      .getListDDRTokenIdOfPatient(patientDID)
      .call();
    let ddrs = Array<any>();
    for (let i = 0; i < tokenIds.length; i++) {
      let ddr = await this.ddr.methods.getToken(parseInt(tokenIds[i])).call();
      ddrs.push(ddr);
    }
    return ddrs;
  }

  public async consentDisclosureDDR(
    ddrIds: Array<string>,
    providerDID: string,
    patientDID: string,
    addressOfDelegateKey: string,
    nonce?: number
  ) {
    try {
      // check valid providerDID
      let isValidProviderDID = await this.authenticator.methods
        .checkAuth(providerDID, "ACCOUNT_TYPE", "PROVIDER")
        .call();
    } catch (error) {
      return Error("Invalid providerDID!");
    }

    // add nonce if not exist
    if (!nonce) {
      var nonce = await this.connection.web3.eth.getTransactionCount(
        addressOfDelegateKey
      );
    }

    let ddrTokenIds = Array<number>();

    for (let i = 0; i < ddrIds.length; i++) {
      let ddrTokenId = await this.ddr.methods
        .getTokenIdOfPatientDIDByRawId(patientDID, ddrIds[i])
        .call();
      ddrTokenIds.push(ddrTokenId);
    }

    var lockDDRAbi = this.ddr.methods
      .consentDisclosureDDR(ddrTokenIds, providerDID)
      .encodeABI();
    var executeAbi = this.claimHolder.methods
      .execute(CONFIG.DDR.address, 0, lockDDRAbi)
      .encodeABI();

    let gas = await this.connection.web3.eth.estimateGas({
      from: addressOfDelegateKey,
      to: patientDID,
      data: executeAbi,
    });
    let gasPrice = await this.connection.web3.eth.getGasPrice();

    const unSignedTx = {
      to: patientDID,
      from: addressOfDelegateKey,
      gas: gas,
      gasPrice: gasPrice,
      nonce: nonce,
      data: executeAbi,
    };

    return unSignedTx;
  }

  public async getShareDDR(patientDID: string, ddrId: string) {
    let ddrTokenId = await this.ddr.methods.getTokenIdOfPatientDIDByRawId(
      patientDID,
      ddrId
    );

    var isSharedDDR = this.ddr.methods
      .isSharedDDR(patientDID, ddrTokenId)
      .call();
    return isSharedDDR;
  }

  public async getConsentedDDR(
    providerDID: string,
    patientDID: string,
    ddrId: string
  ) {
    let ddrTokenId = await this.ddr.methods.getTokenIdOfPatientDIDByRawId(
      patientDID,
      ddrId
    );
    var isConsentedDDR = this.ddr.methods
      .isConsentedDDR(providerDID, ddrTokenId)
      .call();
    return isConsentedDDR;
  }

  public async getLockedDDR(patientDID: string, ddrId: string) {
    let ddrTokenId = await this.ddr.methods.getTokenIdOfPatientDIDByRawId(
      patientDID,
      ddrId
    );
    var isLockedDDR = this.ddr.methods.isLockedDDR(ddrTokenId).call();
    return isLockedDDR;
  }

  public async getAllDisclosureOfProvider(patientDID: string, providerDID: string) {
    let tokenIds = await this.ddr.methods.getListDDRTokenIdOfProvider(
      patientDID,
      providerDID
    ).call();
    
    let disclosureDDR = Array<any>();
    for (let i = 0; i < tokenIds.length; i++) {
      let hashvalue = await this.ddr.methods.getDDRHash(parseInt(tokenIds[i])).call();
      disclosureDDR.push(hashvalue);
    }
    return disclosureDDR;
  }
}

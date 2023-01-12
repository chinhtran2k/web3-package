import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

export class POCStudy {
  private connection: Connection;
  private pcoStudy: Contract;
  private ddr: Contract;
  private ddrBranch: Contract;
  private disclosureBranch: Contract;
  private claimBranch: Contract;
  private patient: Contract;


  constructor(connection: Connection) {
    this.connection = connection;
    this.pcoStudy = new this.connection.web3.eth.Contract(
      CONFIG.POCStudy.abi,
      CONFIG.POCStudy.address
    );
    this.ddr = new this.connection.web3.eth.Contract(
      CONFIG.DDR.abi,
      CONFIG.DDR.address
    );
    this.ddrBranch = new this.connection.web3.eth.Contract(
      CONFIG.DDRBranch.abi,
      CONFIG.DDRBranch.address
    );
    this.disclosureBranch = new this.connection.web3.eth.Contract(
      CONFIG.DisclosureBranch.abi,
      CONFIG.DisclosureBranch.address
    );
    this.claimBranch = new this.connection.web3.eth.Contract(
      CONFIG.ClaimBranch.abi,
      CONFIG.ClaimBranch.address
    );
    this.patient = new this.connection.web3.eth.Contract(
      CONFIG.Patient.abi,
      CONFIG.Patient.address
    );
  }
  public async mintPOCStudy(
    uri: string,
    message: string,
    privateKey: string,
    nonce?: number,
    isSimulate?: boolean
  ) {
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    if (!nonce) {
      var nonce = await this.connection.web3.eth.getTransactionCount(
        account.address
      );
    }

    var mintAbi = await this.pcoStudy.methods.mint(uri, message).encodeABI();

    const receipt = await signAndSendTransaction(
      this.connection,
      mintAbi,
      CONFIG.POCStudy.address,
      privateKey,
      nonce,
      isSimulate!
    );

    const decodedLogsCL = await decodeLogs(receipt.logs, CONFIG.POCStudy.abi);
    let eventLogs = await decodedLogsCL.filter((log: any) => log);
    const eventMintDDR = await decodedLogsCL.filter(
      (log: any) => log.name === "LockedPOC"
    );
    let tokenId = eventMintDDR[0].events.pocTokenId;
    let hashValue = eventMintDDR[0].events.rootHashPOC;

    return { receipt, eventLogs, tokenId, hashValue };
  }

  public async getRootTokenIdPOC() {
    var RootHashPOCPatient = await this.pcoStudy.methods
      .getRootTokenIdPOC()
      .call();
    return RootHashPOCPatient;
  }

  public async getRootNodeIdPOC() {
    var RootNodeIdPOCPatient = await this.pcoStudy.methods
      .getRootNodeIdPOC()
      .call();
    return RootNodeIdPOCPatient;
  }

  public async getRootHashPOC() {
    var RootNodeIdPOCPatient = await this.pcoStudy.methods
      .getRootHashPOC()
      .call();
    return RootNodeIdPOCPatient;
  }

  public async permanentLock(
    privateKey: string,
    nonce?: number,
    isSimulate?: boolean
  ){
    const account =
      this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
    if (!nonce) {
      var nonce = await this.connection.web3.eth.getTransactionCount(
        account.address
      );
    }

    var permanentDDRAbi = await this.ddr.methods.removeOwnerShip().encodeABI();
    var permanentClaimAbi = await this.claimBranch.methods.removeOwnerShip().encodeABI();
    var permanentDDRBranhAbi = await this.ddrBranch.methods.removeOwnerShip().encodeABI();
    var permanentDisclosureBranhAbi = await this.disclosureBranch.methods.removeOwnerShip().encodeABI();
    var permanentPOCStudyAbi = await this.pcoStudy.methods.removeOwnerShip().encodeABI();
    var permanentPatientAbi = await this.patient.methods.removeOwnerShip().encodeABI();

    const receipt = await Promise.all([
       signAndSendTransaction(
        this.connection,
        permanentDDRAbi,
        CONFIG.DDR.address,
        privateKey,
        nonce ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permanentClaimAbi,
        CONFIG.ClaimBranch.address,
        privateKey,
        nonce + 1 ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permanentDDRBranhAbi,
        CONFIG.DDRBranch.address,
        privateKey,
        nonce + 2 ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permanentDisclosureBranhAbi,
        CONFIG.DisclosureBranch.address,
        privateKey,
        nonce + 3 ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permanentPatientAbi,
        CONFIG.Patient.address,
        privateKey,
        nonce + 4 ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permanentPOCStudyAbi,
        CONFIG.POCStudy.address,
        privateKey,
        nonce + 5 ,
        isSimulate
      )
    ])

    return { receipt };
  }
}

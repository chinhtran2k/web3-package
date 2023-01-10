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

  public async permamentLock(
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

    var permamentDDRAbi = await this.ddr.methods.transferOwnerShip().encodeABI();
    var permamentClaimAbi = await this.claimBranch.methods.transferOwnerShip().encodeABI();
    var permamentDDRBranhAbi = await this.ddrBranch.methods.transferOwnerShip().encodeABI();
    var permamentDisclosureBranhAbi = await this.disclosureBranch.methods.transferOwnerShip().encodeABI();
    var permamentPOCStudyAbi = await this.pcoStudy.methods.transferOwnerShip().encodeABI();
    var permamentPatientAbi = await this.patient.methods.transferOwnerShip().encodeABI();

    const receipt = await Promise.all([
       signAndSendTransaction(
        this.connection,
        permamentDDRAbi,
        CONFIG.DDR.address,
        privateKey,
        nonce ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permamentClaimAbi,
        CONFIG.ClaimBranch.address,
        privateKey,
        nonce + 1 ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permamentDDRBranhAbi,
        CONFIG.DDRBranch.address,
        privateKey,
        nonce + 2 ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permamentDisclosureBranhAbi,
        CONFIG.DisclosureBranch.address,
        privateKey,
        nonce + 3 ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permamentPatientAbi,
        CONFIG.Patient.address,
        privateKey,
        nonce + 4 ,
        isSimulate
      ),
      signAndSendTransaction(
        this.connection,
        permamentPOCStudyAbi,
        CONFIG.POCStudy.address,
        privateKey,
        nonce + 5 ,
        isSimulate
      )
    ])

    return { receipt };
  }
}

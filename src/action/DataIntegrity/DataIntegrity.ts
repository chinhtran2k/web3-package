import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { keccak256 } from "@ethersproject/keccak256";
// import assert from "assert";
import { BinarySearchTreeNode } from "../../utils/linkedList";
const assert = require("assert");

export class DataIntegrity {
  private connection: Connection;
  private ddr: Contract;
  private claimBranch: Contract;
  private claimHolder: Contract;
  private authenticator: any;
  private ddrBranch: Contract;
  private disclosureBranch: Contract;
  private patient: Contract;
  private pcoStudy: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.authenticator = new connection.web3.eth.Contract(
      CONFIG.Authenticator.abi,
      CONFIG.Authenticator.address
    );
    this.ddr = new this.connection.web3.eth.Contract(
      CONFIG.DDR.abi,
      CONFIG.DDR.address
    );
    this.claimBranch = new this.connection.web3.eth.Contract(
      CONFIG.ClaimBranch.abi,
      CONFIG.ClaimBranch.address
    );
    this.patient = new this.connection.web3.eth.Contract(
      CONFIG.Patient.abi,
      CONFIG.Patient.address
    );
    this.ddrBranch = new this.connection.web3.eth.Contract(
      CONFIG.DDRBranch.abi,
      CONFIG.DDRBranch.address
    );
    this.disclosureBranch = new this.connection.web3.eth.Contract(
      CONFIG.DisclosureBranch.abi,
      CONFIG.DisclosureBranch.address
    );
    this.pcoStudy = new this.connection.web3.eth.Contract(
      CONFIG.POCStudy.abi,
      CONFIG.POCStudy.address
    );
  }

  public checkIntegritySingleDDR = async (
    patientDID: string,
    tokenId: number,
    ddrId: string,
    hashDDROffChain: string,
    providerDID?: string
  ) => {
    const tokenIdOnChain = await this.ddr.methods
      .getTokenIdOfPatientDIDByRawId(patientDID, ddrId)
      .call();
    if (providerDID) {
      if (tokenIdOnChain == tokenId) {
        const hashDDROnChain = await this.ddr.methods
          .getDDRHash(tokenId, patientDID)
          .call();
        if (hashDDROnChain === hashDDROffChain) {
          const isConsentedDDR = await this.ddr.methods
            .isConsentedDDR(patientDID, ddrId)
            .call();
          return isConsentedDDR;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      if (tokenIdOnChain == tokenId) {
        const hashDDROnChain = await this.ddr.methods
          .getDDRHash(tokenId, patientDID)
          .call();
        if (hashDDROnChain === hashDDROffChain) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  };

  public checkIntegritySingleClaim = async (
    accountDID: string,
    claimIssuer: string,
    claimKey: string,
    claimValue: string,
    hashClaimOffChain: string
  ) => {
    const didContract = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi,
      accountDID
    );
    const claimId = keccak256(
      await this.connection.web3.utils.encodePacked(
        { value: claimIssuer, type: "address" },
        { value: claimKey, type: "string" }
      )
    );
    let tempData = this.connection.web3.utils.asciiToHex(claimValue);
    const obj = await didContract.methods.getClaim(claimId).call();
    if (tempData == obj.data) {
      let hashClaimOnChain = await didContract.methods
        .getHashClaim(claimId)
        .call();
      if (hashClaimOnChain == hashClaimOffChain) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  public checkIntegritySingleClaimBranch = async (
    tokenId: number,
    accountDID: string,
    hashClaimBranchOffChain: string
  ) => {
    const hashClaimBranchOnChain = await this.claimBranch.methods
      .getHashClaimOfToken(tokenId, accountDID)
      .call();
    if (hashClaimBranchOffChain === hashClaimBranchOnChain) {
      return true;
    } else {
      return false;
    }
  };

  public checkIntegritySingleDDRBranch = async (
    tokenId: number,
    patientDID: string,
    hashDDRBranchOffChain: string
  ) => {
    // Check root
    const hashDDRBranchOnChain = await this.ddrBranch.methods
      .getHashDDRBranchOfTokenId(tokenId, patientDID)
      .call();
    return hashDDRBranchOnChain === hashDDRBranchOffChain;
  };

  public checkIntegritySingleDisclosureBranch = async (
    tokenId: number,
    patientDID: string,
    hashDisclosureBranchOffChain: string
  ) => {
    // Check root
    const hashDisclosureBranchOnChain = await this.disclosureBranch.methods
      .getRootHashDisclosureOfTokenId(tokenId, patientDID)
      .call();
    return hashDisclosureBranchOffChain === hashDisclosureBranchOnChain;
  };

  public checkIntegritySinglePatient = async (
    tokenId: number,
    patientDID: string,
    hashPatientOffChain: string
  ) => {
    // Check root
    const hashPatientOnChain = await this.patient.methods
      .getRootHashValueOfTokenId(tokenId, patientDID)
      .call();
    return hashPatientOffChain === hashPatientOnChain;
  };

  public checkIntegrityStudy = async (hashPOCStudyOffChain: string) => {
    // Check root
    const hashPOCStudyOnChain = await this.pcoStudy.methods
      .getRootHashPOC()
      .call();
    return hashPOCStudyOnChain === hashPOCStudyOffChain;
  };
}

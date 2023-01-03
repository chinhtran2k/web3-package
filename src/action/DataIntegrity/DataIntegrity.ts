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
  private claim: Contract;
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
    this.claim = new this.connection.web3.eth.Contract(
      CONFIG.Claim.abi,
      CONFIG.Claim.address
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
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
    this.pcoStudy = new this.connection.web3.eth.Contract(
      CONFIG.POCStudy.abi,
      CONFIG.POCStudy.address
    );
  }

  private copyArrayToArrayUINT256 = async (
    arrayFrom: Array<number>,
    arrayTo: Array<number>
  ) => {
    for (let i = 0; i < arrayFrom.length; i++) {
      arrayTo[i] = arrayFrom[i];
    }
    arrayTo[arrayFrom.length] = 0;

    return arrayTo;
  };

  private popQueue(queueNode: Array<string>, index: number) {
    for (let i = index; i < queueNode.length - 1; i++) {
      queueNode[i] = queueNode[i + 1];
    }
    queueNode.pop();
    return queueNode;
  }

  public checkIntegritySingleDDR = async (
    patientDID: string,
    ddrId: string,
    hashedValue: string,
    ddrConsentedTo: Array<string>
  ) => {
    let tokenId = await this.ddr.methods
      .getTokenIdOfPatientDIDByRawId(patientDID, ddrId)
      .call();
    let consentedDID = await this.ddr.methods
      .getDIDConsentedOf(parseInt(tokenId))
      .call();
    assert(
      consentedDID.length === ddrConsentedTo.length,
      "Consented list length not match"
    );
    for (let i = 0; i < ddrConsentedTo.length; i++) {
      if (ddrConsentedTo[i] !== consentedDID[i]) {
        return false;
      }
    }

    const ddrHashValue = await this.ddr.methods
      .getDDRHashOfPatientDIDByRawId(patientDID, ddrId)
      .call();
    if (ddrHashValue === hashedValue) {
      return true;
    } else {
      return false;
    }
  };

  public checkIntegritySingleClaim = async (
    accountDID: string,
    accountId: string,
    hashedDataClaim: string
  ) => {
    const ddrHashOffChain = keccak256(
      await this.connection.web3.utils.encodePacked(
        { value: accountDID, type: "address" },
        { value: accountId, type: "string" },
        { value: hashedDataClaim, type: "bytes32" }
      )
    );

    const hashValueOnChain = await this.claim.methods
      .getHashValueClaim(accountDID)
      .call();
    if (ddrHashOffChain === hashValueOnChain) {
      return true;
    } else {
      return false;
    }
  };

  public checkIntegritySingleDDRBranch = async (
    tokenId: string,
    patientDID: string,
    ddrsId: Array<string>,
    ddrshashedValue: Array<string>
  ) => {
    let queueNode: Array<any> = [];
    let tempNode: Array<any> = [];

    let ddrHashValue: Array<string> = [];
    assert(ddrsId.length === ddrshashedValue.length, "Length not match");

    for (let i = 0; i < ddrsId.length; i++) {
      ddrHashValue.push(
        keccak256(
          this.connection.web3.utils.encodePacked(
            { value: patientDID, type: "address" },
            { value: ddrsId[i], type: "string" },
            { value: ddrshashedValue[i], type: "bytes32" }
          )
        )
      );
    }

    let listDDROfPatient: Array<number> = await this.ddr.methods
      .getListDDRTokenIdOfPatient(patientDID)
      .call();
    let listDDRLength = listDDROfPatient.length;

    assert(
      listDDRLength == ddrshashedValue.length,
      "Hashed data length does not match!"
    );

    if (listDDRLength === 0) {
      return false;
    }

    if (listDDRLength % 2 == 1) {
      listDDRLength = listDDRLength + 1;
      let templistDDROfPatient = new Array<number>(listDDRLength);
      templistDDROfPatient = await this.copyArrayToArrayUINT256(
        listDDROfPatient,
        templistDDROfPatient
      );
      listDDROfPatient = templistDDROfPatient;
    }

    if (listDDROfPatient.length - ddrHashValue.length == 1) {
      ddrHashValue[ddrHashValue.length] =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
    }

    // Init bottom level
    for (let i = 0; i < listDDRLength; i++) {
      let merkleNodeTemp = new BinarySearchTreeNode(
        ddrHashValue[i],
        null,
        null
      );
      console;
      queueNode.push(merkleNodeTemp);
    }

    // Build merkle tree
    while (queueNode.length > 1) {
      while (tempNode.length != 0) {
        tempNode.pop();
      }

      // handle even number of nodes
      if (queueNode.length % 2 == 1) {
        queueNode.push(
          new BinarySearchTreeNode(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            null,
            null
          )
        );
      }

      // build tree
      while (queueNode.length > 0) {
        let upperNode = new BinarySearchTreeNode(
          await keccak256(
            this.connection.web3.utils.encodePacked(
              { value: queueNode[0].data, type: "bytes32" },
              { value: queueNode[1].data, type: "bytes32" }
            )
          ),
          queueNode[0],
          queueNode[1]
        );

        tempNode.push(upperNode);

        // remove node queue
        queueNode = this.popQueue(queueNode, 0);
        queueNode = this.popQueue(queueNode, 0);
      }

      queueNode = Array.from(tempNode);
    }

    // Check root
    const rootHashOnChain = await this.ddrBranch.methods
      .getTokenIdRootHashDDR(tokenId)
      .call();

    const rootHashOffChain = keccak256(
      this.connection.web3.utils.encodePacked(
        { value: patientDID, type: "address" },
        { value: queueNode[0].data, type: "bytes32" },
        { value: tokenId, type: "uint256" }
      )
    );

    return rootHashOnChain === rootHashOffChain;
  };

  public checkIntegritySingleDisclosureBranch = async (
    tokenId: string,
    patientDID: string,
    providerDID: string,
    ddrsId: Array<string>,
    ddrshashedValue: Array<string>
  ) => {
    let queueNode: Array<any> = [];
    let tempNode: Array<any> = [];

    let ddrHashValue: Array<string> = [];
    assert(ddrsId.length === ddrshashedValue.length, "Length not match");

    for (let i = 0; i < ddrsId.length; i++) {
      ddrHashValue.push(
        keccak256(
          this.connection.web3.utils.encodePacked(
            { value: patientDID, type: "address" },
            { value: ddrsId[i], type: "string" },
            { value: ddrshashedValue[i], type: "bytes32" }
          )
        )
      );
    }

    let listDDROfProvider: Array<number> = await this.ddr.methods
      .getListDDRTokenIdOfProvider(patientDID, providerDID)
      .call();
    let listDDRLength = listDDROfProvider.length;
    assert(
      listDDRLength == ddrshashedValue.length,
      "Hashed data length does not match!"
    );

    if (listDDRLength === 0) {
      return false;
    }

    if (listDDRLength % 2 == 1) {
      listDDRLength = listDDRLength + 1;
      let templistDDROfPatient = new Array<number>(listDDRLength);
      templistDDROfPatient = await this.copyArrayToArrayUINT256(
        listDDROfProvider,
        templistDDROfPatient
      );
      listDDROfProvider = templistDDROfPatient;
    }

    if (listDDROfProvider.length - ddrHashValue.length == 1) {
      ddrHashValue[ddrHashValue.length] =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
    }

    // Init bottom level
    for (let i = 0; i < listDDRLength; i++) {
      let merkleNodeTemp = new BinarySearchTreeNode(
        ddrHashValue[i],
        null,
        null
      );
      console;
      queueNode.push(merkleNodeTemp);
    }

    // Build merkle tree
    while (queueNode.length > 1) {
      while (tempNode.length != 0) {
        tempNode.pop();
      }

      // handle even number of nodes
      if (queueNode.length % 2 == 1) {
        queueNode.push(
          new BinarySearchTreeNode(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            null,
            null
          )
        );
      }

      // build tree
      while (queueNode.length > 0) {
        let upperNode = new BinarySearchTreeNode(
          await keccak256(
            this.connection.web3.utils.encodePacked(
              { value: queueNode[0].data, type: "bytes32" },
              { value: queueNode[1].data, type: "bytes32" }
            )
          ),
          queueNode[0],
          queueNode[1]
        );

        tempNode.push(upperNode);

        // remove node queue
        queueNode = this.popQueue(queueNode, 0);
        queueNode = this.popQueue(queueNode, 0);
      }

      queueNode = Array.from(tempNode);
    }

    // Check root
    const rootHashOnChain = await this.disclosureBranch.methods
      .getTokenIdRootHashDisclosure(tokenId)
      .call();
    const rootHashOffChain = keccak256(
      this.connection.web3.utils.encodePacked(
        { value: providerDID, type: "address" },
        { value: queueNode[0].data, type: "bytes32" },
        { value: tokenId, type: "uint256" }
      )
    );
    console.log(rootHashOnChain);
    console.log(rootHashOffChain);
    return rootHashOnChain === rootHashOffChain;
  };

  public checkIntegritySinglePatient = async (
    tokenId: string,
    patientDID: string,
    hashClaim: string,
    ddrBranchHashs: Array<string>,
    disclosureBranchHashs: Array<string>
  ) => {
    let queueNode: Array<any> = [];
    let tempNode: Array<any> = [];

    let listDDRBranch: Array<string> = await this.ddrBranch.methods
      .getListRootHashDDR()
      .call();

    assert(
      ddrBranchHashs.length == listDDRBranch.length,
      "Hashed data of patient length does not match!"
    );

    let listDisclosure: Array<string> = await this.disclosureBranch.methods
      .getListRootHashDisclosure()
      .call();

    assert(
      disclosureBranchHashs.length == listDisclosure.length,
      "Hashed data of provider length does not match!"
    );

    let listHashValue = new Array<string>(
      ddrBranchHashs.length + disclosureBranchHashs.length
    );
    for (let i = 0; i < ddrBranchHashs.length; i++) {
      listHashValue[i] = ddrBranchHashs[i];
    }
    for (let i = 0; i < disclosureBranchHashs.length; i++) {
      listHashValue[i + ddrBranchHashs.length] = disclosureBranchHashs[i];
    }

    let listLevelRootHashLength = listHashValue.length;

    if (listLevelRootHashLength % 2 == 1) {
      listLevelRootHashLength = listLevelRootHashLength + 1;

      let _tempListLevelRootHash = new Array<string>(listLevelRootHashLength);

      for (let k = 0; k < listLevelRootHashLength; k++) {
        _tempListLevelRootHash[k] = listHashValue[k];
      }

      _tempListLevelRootHash[listLevelRootHashLength - 1] =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      listHashValue = _tempListLevelRootHash;
    }

    // Init bottom level
    for (let i = 0; i < listLevelRootHashLength; i++) {
      let merkleNodeTemp = new BinarySearchTreeNode(
        listHashValue[i],
        null,
        null
      );

      queueNode.push(merkleNodeTemp);
    }

    // Build merkle tree
    while (queueNode.length > 1) {
      while (tempNode.length != 0) {
        tempNode.pop();
      }

      // handle even number of nodes
      if (queueNode.length % 2 == 1) {
        queueNode.push(
          new BinarySearchTreeNode(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            null,
            null
          )
        );
      }

      // build tree
      while (queueNode.length > 0) {
        let upperNode = new BinarySearchTreeNode(
          await keccak256(
            this.connection.web3.utils.encodePacked(
              { value: queueNode[0].data, type: "bytes32" },
              { value: queueNode[1].data, type: "bytes32" }
            )
          ),
          queueNode[0],
          queueNode[1]
        );

        tempNode.push(upperNode);

        // remove node queue
        queueNode = this.popQueue(queueNode, 0);
        queueNode = this.popQueue(queueNode, 0);
      }

      queueNode = Array.from(tempNode);
    }

    // Check root
    const rootHashOnChain = await this.patient.methods
      .getPatientRootHashValue(patientDID)
      .call();

    const rootHashOffChain = keccak256(
      this.connection.web3.utils.encodePacked(
        { value: patientDID, type: "address" },
        { value: queueNode[0].data, type: "bytes32" },
        { value: hashClaim, type: "bytes32" },
        { value: tokenId, type: "uint256" }
      )
    );
    console.log(rootHashOnChain);
    console.log(rootHashOffChain);
    return rootHashOnChain === rootHashOffChain;
  };

  public checkIntegrityStudy = async (rootHashValuesPatient: Array<string>) => {
    let queueNode: Array<any> = [];
    let tempNode: Array<any> = [];

    let listPatientAddress: Array<string> = await this.patient.methods
      .getListAddressPatient()
      .call();

    assert(
      listPatientAddress.length == rootHashValuesPatient.length,
      "Hashed data of patient length does not match!"
    );

    let listLevelRootHashLength = rootHashValuesPatient.length;

    if (listLevelRootHashLength % 2 == 1) {
      listLevelRootHashLength = listLevelRootHashLength + 1;

      let _tempListLevelRootHash = new Array<string>(listLevelRootHashLength);

      for (let k = 0; k < listLevelRootHashLength; k++) {
        _tempListLevelRootHash[k] = rootHashValuesPatient[k];
      }

      _tempListLevelRootHash[listLevelRootHashLength - 1] =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      rootHashValuesPatient = _tempListLevelRootHash;
    }

    // Init bottom level
    for (let i = 0; i < listLevelRootHashLength; i++) {
      let merkleNodeTemp = new BinarySearchTreeNode(
        rootHashValuesPatient[i],
        null,
        null
      );

      queueNode.push(merkleNodeTemp);
    }

    // Build merkle tree
    while (queueNode.length > 1) {
      while (tempNode.length != 0) {
        tempNode.pop();
      }

      // handle even number of nodes
      if (queueNode.length % 2 == 1) {
        queueNode.push(
          new BinarySearchTreeNode(
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            null,
            null
          )
        );
      }

      // build tree
      while (queueNode.length > 0) {
        let upperNode = new BinarySearchTreeNode(
          await keccak256(
            this.connection.web3.utils.encodePacked(
              { value: queueNode[0].data, type: "bytes32" },
              { value: queueNode[1].data, type: "bytes32" }
            )
          ),
          queueNode[0],
          queueNode[1]
        );

        tempNode.push(upperNode);

        // remove node queue
        queueNode = this.popQueue(queueNode, 0);
        queueNode = this.popQueue(queueNode, 0);
      }

      queueNode = Array.from(tempNode);
    }

    // Check root
    const rootHashOnChain = await this.pcoStudy.methods.getRootHashPOC().call();
    const rootHashOffChain = queueNode[0].data;

    return rootHashOnChain === rootHashOffChain;
  };
}

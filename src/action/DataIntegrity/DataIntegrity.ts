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
  private claimHolder: Contract;
  private authenticator: any;
  private patient: Contract;
  private provider: Contract;
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
    this.patient = new this.connection.web3.eth.Contract(
      CONFIG.Patient.abi,
      CONFIG.Patient.address
    );
    this.provider = new this.connection.web3.eth.Contract(
      CONFIG.Provider.abi,
      CONFIG.Provider.address
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

  private encodePackedListAddress(listAddress: Array<string>) {
    let encoded = "0x";
    let prefix = "0x000000000000000000000000";
    for (let i = 0; i < listAddress.length; i++) {
      let addrToByte32 = prefix + listAddress[i].slice(2);
      let encodeByte32 = this.connection.web3.utils.encodePacked({
        value: addrToByte32,
        type: "bytes32",
      });
      encoded += encodeByte32.slice(2);
    }
    return encoded;
  }

  public checkIntegritySingleDDR = async (
    patientDID: string,
    ddrId: string,
    hashedData: string,
    ddrConsentedTo: Array<string>
  ) => {
    const ddrHashLocal = keccak256(
      await this.connection.web3.utils.encodePacked(
        { value: patientDID, type: "address" },
        { value: ddrId, type: "string" },
        { value: hashedData, type: "bytes32" }
      )
    );

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
    if (ddrHashValue === ddrHashLocal) {
      return true;
    } else {
      return false;
    }
  };

  public checkIntegritySinglePatient = async (
    patientDID: string,
    hashClaim: string,
    ddrsRawId: Array<string>,
    ddrsHashedData: Array<string>,
    ddrsConsentedTo: Array<Array<string>>
  ) => {
    let queueNode: Array<any> = [];
    let tempNode: Array<any> = [];

    let ddrHashValue: Array<string> = [];
    assert(ddrsRawId.length === ddrsHashedData.length, "Length not match");

    for (let i = 0; i < ddrsRawId.length; i++) {
      ddrHashValue.push(
        keccak256(
          this.connection.web3.utils.encodePacked(
            { value: patientDID, type: "address" },
            { value: ddrsRawId[i], type: "string" },
            { value: ddrsHashedData[i], type: "bytes32" }
          )
        )
      );
    }

    let listDDROfPatient: Array<number> = await this.ddr.methods
      .getListDDRTokenIdOfPatient(patientDID)
      .call();
    let listDDRLength = listDDROfPatient.length;

    assert(
      listDDRLength == ddrsHashedData.length,
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
      let combineConsentedDID =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      if (ddrsConsentedTo[i] && ddrsConsentedTo[i].length > 0) {
        combineConsentedDID = keccak256(
          this.connection.web3.utils.encodePacked({
            value: this.encodePackedListAddress(ddrsConsentedTo[i]),
            type: "bytes32",
          })
        );
      }
      let ddrCombinedHash = await keccak256(
        this.connection.web3.utils.encodePacked(
          { value: ddrHashValue[i], type: "bytes32" },
          { value: combineConsentedDID, type: "bytes32" }
        )
      );

      let merkleNodeTemp = new BinarySearchTreeNode(
        ddrCombinedHash,
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
    const rootHashOnChain = await this.patient.methods
      .getPatientRootHashValue(patientDID)
      .call();
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi,
      patientDID
    );
    const rootHashOffChain = keccak256(
      this.connection.web3.utils.encodePacked(
        { value: patientDID, type: "address" },
        { value: queueNode[0].data, type: "bytes32" },
        { value: hashClaim, type: "bytes32" }
      )
    );

    return rootHashOnChain === rootHashOffChain;
  };

  public checkIntegritySingleProvider = async (
    providerDID: string,
    accountID: string,
    hashClaim: string
  ) => {
    const rootHashOnChain = await this.provider.methods
      .getHashValueProvider(providerDID)
      .call();
    const rootHashOffChain = keccak256(
      this.connection.web3.utils.encodePacked(
        { value: providerDID, type: "address" },
        { value: accountID, type: "string" },
        { value: hashClaim, type: "bytes32" }
      )
    );
    if (rootHashOffChain === rootHashOnChain) {
      return true;
    } else {
      return false;
    }
  };

  public checkIntegrityStudy = async (
    rootHashValuesPatient: Array<string>,
    rootHashValuesProvider: Array<string>
  ) => {
    let queueNode: Array<any> = [];
    let tempNode: Array<any> = [];

    let listPatientAddress: Array<string> = await this.patient.methods
      .getListAddressPatient()
      .call();

    assert(
      listPatientAddress.length == rootHashValuesPatient.length,
      "Hashed data of patient length does not match!"
    );

    let listProviderAddress: Array<string> = await this.provider.methods
      .getListAddressOfProvider()
      .call();

    assert(
      listProviderAddress.length == rootHashValuesProvider.length,
      "Hashed data of provider length does not match!"
    );

    let listHashValue = new Array<string>(
      rootHashValuesPatient.length + rootHashValuesProvider.length
    );
    for (let i = 0; i < rootHashValuesPatient.length; i++) {
      listHashValue[i] = rootHashValuesPatient[i];
    }
    for (let i = 0; i < rootHashValuesProvider.length; i++) {
      listHashValue[i + rootHashValuesPatient.length] =
        rootHashValuesProvider[i];
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
    const rootHashOnChain = await this.pcoStudy.methods.getRootHashPOC().call();
    const rootHashOffChain = queueNode[0].data;

    return rootHashOnChain === rootHashOffChain;
  };
}

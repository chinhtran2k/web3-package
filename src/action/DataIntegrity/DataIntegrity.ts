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
  private pcoStudy: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.authenticator = new connection.web3.eth.Contract(
      CONFIG.Authenticator.abi,
      CONFIG.Authenticator.address
    );
    this.claimHolder = new this.connection.web3.eth.Contract(
      CONFIG.ClaimHolder.abi
    );
    this.ddr = new this.connection.web3.eth.Contract(
      CONFIG.DDR.abi,
      CONFIG.DDR.address
    );
    this.patient = new this.connection.web3.eth.Contract(
      CONFIG.Patient.abi,
      CONFIG.Patient.address
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
    hashedData: string
  ) => {
    const ddrHashLocal = keccak256(
      await this.connection.web3.utils.encodePacked(
        { value: patientDID, type: "address" },
        { value: ddrId, type: "string" },
        { value: hashedData, type: "bytes32" }
      )
    );
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
    ddrsRawId: Array<string>,
    ddrsHashedData: Array<string>
  ) => {
    let queueNode: Array<any> = [];
    let tempNode: Array<any> = [];

    let ddrHashValue: Array<string> = [];
    console.log("ddrsRawId", ddrsRawId);
    console.log("ddrsRawId", ddrsHashedData);
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

    console.log("ddrHashValue", ddrHashValue);

    let listDDROfPatient: Array<number> = await this.ddr.methods
      .getListDDRHashValueOfPatient(patientDID)
      .call();
    let listDDRLength = listDDROfPatient.length;

    console.log(listDDRLength);

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
    console.log("listDDROfPatient", listDDROfPatient);

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

    console.log(queueNode);

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

    const rootHashOffChain = queueNode[0].data;

    return rootHashOnChain === rootHashOffChain;
  };

  public checkIntegrityStudy = async (rootHashValues: Array<string>) => {
    let queueNode: Array<any> = [];
    let tempNode: Array<any> = [];

    let listLevelRootHash: Array<string> = await this.patient.methods
      .getListRootHashValue()
      .call();
    let listLevelRootHashLength = listLevelRootHash.length;

    assert(
      listLevelRootHashLength == rootHashValues.length,
      "Hashed data length does not match!"
    );

    assert(listLevelRootHashLength > 0, "No root hash value");

    let listTokenLevel = new Array<number>(listLevelRootHashLength);
    for (let i = 0; i < listLevelRootHashLength; i++) {
      listTokenLevel[i] = i;
    }

    if (listLevelRootHashLength % 2 == 1) {
      listLevelRootHashLength = listLevelRootHashLength + 1;
      let templistTokenLevelRootHash = new Array<number>(
        listLevelRootHashLength
      );
      templistTokenLevelRootHash = await this.copyArrayToArrayUINT256(
        listTokenLevel,
        templistTokenLevelRootHash
      );
      listTokenLevel = templistTokenLevelRootHash;
    }

    if (listTokenLevel.length - rootHashValues.length == 1) {
      rootHashValues[rootHashValues.length] =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
    }

    // Init bottom level
    for (let i = 0; i < listLevelRootHashLength; i++) {
      let merkleNodeTemp = new BinarySearchTreeNode(
        rootHashValues[i],
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
      .getRootHashPOCPatient()
      .call();

    const rootHashOffChain = queueNode[0].data;

    return rootHashOnChain === rootHashOffChain;
  };
}

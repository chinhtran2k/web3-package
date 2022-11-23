import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { ClaimTypes } from "../../types/AuthType";
import { BinarySearchTreeNode } from "src/utils/linkedList";
import { signAndSendTransaction } from "../../utils";
const { decodeLogs } = require("abi-parser-pack");

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

  private queueNode: Array<string>;
  private tempNode: Array<string>;

  public checkIntegritySingleDDR = async (
    ddrId: string,
    hashedData: string
  ) => {
    const ddrHashValue = await this.ddr.methods.getDDRHashByRawId(ddrId).call();
    if (ddrHashValue === hashedData) {
      return true;
    } else {
      return false;
    }
  };

  public copyArrayToArrayUINT256 = async (
    arrayFrom: Array<number>,
    arrayTo: Array<number>
  ) => {
    for (let i = 0; i < arrayFrom.length; i++) {
      arrayTo[i] = arrayFrom[i];
    }
    return arrayTo;
  };

  private popQueue(index: number) {
    // uint256 valueAtIndex = nodeArr[index]
    for (let i = index; i < this.queueNode.length - 1; i++) {
      this.queueNode[i] = this.queueNode[i + 1];
    }

    this.queueNode.pop();
  }

  public checkIntegritySinglePatient = async (patientDID: string) => {
    let listDDROfPatient: Array<number> = await this.ddr.methods
      .getListDDRHashValueOfPatient(patientDID)
      .call();
    let listDDRLength = listDDROfPatient.length;

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

    while (this.queueNode.length != 0) {
      this.queueNode.pop();
    }
    while (this.tempNode.length != 0) {
      this.tempNode.pop();
    }

    // Initial bottom level data
    for (let i = 0; i < listDDRLength; i++) {
      // Bottom level doesn't have child
      let merkleNodeTemp = new BinarySearchTreeNode(
        this.ddr.methods.getDDRHash(listDDROfPatient[i]),
        null,
        null
      );

      // Generate unique node id base on hashValue
      let nodeId = this.connection.web3.utils.encodePacked(
        { value: merkleNodeTemp.data, type: "bytes32" },
        { value: merkleNodeTemp.leftNode, type: "bytes32" },
        { value: merkleNodeTemp.rightNode, type: "bytes32" }
      );
      this.queueNode.push(nodeId);
      _allNodes[nodeId] = merkleNodeTemp;
      this.merkleLength += 1;
    }
  };
}

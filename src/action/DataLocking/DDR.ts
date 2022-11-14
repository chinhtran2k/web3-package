import { CONFIG } from "../../config";
import { Connection } from "../../utils";
import { Contract } from "web3-eth-contract/types";
import { keccak256 } from "@ethersproject/keccak256";
import { ClaimTypes } from "../../types/AuthType";
import { signAndSendTransaction } from "../../utils";

export class DDR {
  private connection: Connection;
  private ddr: Contract;
  private identity: Contract;

  constructor(connection: Connection) {
    this.connection = connection;
    this.ddr = new this.connection.web3.eth.Contract(
      CONFIG.DDR.abi,
      CONFIG.DDR.address
    );
    this.identity = new this.connection.web3.eth.Contract(CONFIG.Identity.abi);
  }

  public async mintDDR(
    hashedData: string,
    ddrRawId: string,
    uri: string,
    patientDID: string,
    pharmacyDID: string,
    privateKey: string
  ) {
    var mintAbi = await this.ddr.methods
      .mint(hashedData, ddrRawId, uri, patientDID)
      .encodeABI();

    var executeAbi = this.identity.methods
      .execute(CONFIG.DDR.address, 0, mintAbi)
      .encodeABI();

    const tx = await signAndSendTransaction(
      this.connection,
      executeAbi,
      pharmacyDID,
      privateKey
    );

    return tx;
  }
}

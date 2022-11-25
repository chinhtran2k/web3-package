import { AbiItem, AbiInput } from "web3-utils/types";

interface ICONFIG {
  Authenticator: Authenticator;
  AuthenticatorHelper: AuthenticatorHelper;
  DDR: DDR;
  Patient: Patient;
  Pharmacy: Pharmacy;
  POCStudy: POCStudy;
  ClaimHolder: ClaimHolder;
  ERC20Proxy: ERC20Proxy;
}
interface Authenticator {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface AuthenticatorHelper {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface DDR {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface Patient {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface Pharmacy {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface POCStudy {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface ERC20Proxy {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface ClaimHolder {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

import * as jsonConfig from "./config.json";

const CONFIG: ICONFIG = require("./config.json");
export { CONFIG };

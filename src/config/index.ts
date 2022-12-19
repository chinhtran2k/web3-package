import { AbiItem, AbiInput } from "web3-utils/types";

interface ICONFIG {
  ClaimHolder: ClaimHolder;
  ClaimVerifier: ClaimVerifier;
  Identity: Identity;
  Authenticator: Authenticator;
  AuthenticatorHelper: AuthenticatorHelper;
  DDR: DDR;
  Patient: Patient;
  Provider: Provider;
  POCStudy: POCStudy;
  ERC20Proxy: ERC20Proxy;
  PCO: PCO;
}

interface ClaimHolder {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface ClaimVerifier {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface Identity {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
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

interface Provider {
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

interface PCO {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

import * as jsonConfig from "./config.json";

const CONFIG: ICONFIG = require("./config.json");
export { CONFIG };

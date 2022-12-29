import { AbiItem, AbiInput } from "web3-utils/types";
import * as dotenv from "dotenv";

dotenv.config();

interface ICONFIG {
  ClaimHolder: ClaimHolder;
  ClaimVerifier: ClaimVerifier;
  Identity: Identity;
  Authenticator: Authenticator;
  AuthenticatorHelper: AuthenticatorHelper;
  DDR: DDR;
  DDRBranch: DDRBranch;
  DisclosureBranch: DisclosureBranch;
  Patient: Patient;
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

interface DDRBranch {
  address: string;
  abi: AbiItem[];
  bytecode: string;
  contractName: string;
}

interface DisclosureBranch {
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

const CONFIG: ICONFIG = require(process.env.CONFIG_PATH || "./config.json");
export { CONFIG };

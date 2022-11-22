export enum KeyPurposes {
  MANAGEMENT = 1,
  ACTION = 2,
  CLAIM_SIGNER = 3,
  ENCRYPTION = 4,
}

export enum Schemes {
  ECDSA = 1,
  RSA = 2,
  CONTRACT_CALL = 3,
  SELF_CLAIM = 4,
}

export enum ClaimTypes {
  PATIENT = 1,
  PROVIDER = 2
}

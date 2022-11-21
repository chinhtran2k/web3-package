export default class InputDataDecoder {
    constructor(abi: any);
  
    decodeConstructor(data: Buffer | string): InputData;
  
    decodeData(data: Buffer | string): InputData;
  }
  export interface InputData {
    method: string | null;
    types: string[];
    inputs: any[];
    names: any;
  }
  
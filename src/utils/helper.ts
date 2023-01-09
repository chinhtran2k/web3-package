import { TransactionReceipt, TransactionConfig } from "web3-core/types";
import { Connection } from "./connection";
import InputDataDecoder, { InputData } from "./etherHelper";

export interface signTransactionOutput {
  eventContract: InputData;
  transactionObject: TransactionReceipt;
}

// const getAbi = (address) => {
//   try {
//     return Object.values(CONFIG).filter((e) => e.address == address)[0].abi;
//   } catch (error) {
//     console.log(`getAbi() error: ${error.message}`);
//     return [];
//   }
// };

const signAndSendTransaction = async (
  connection: Connection,
  data: any,
  to: string,
  privateKey: string,
  nonce?: number,
  isSimulate?: boolean
): Promise<any> => {
  const web3 = connection.web3;
  const address = web3.eth.accounts.privateKeyToAccount(privateKey);
  let gas = await web3.eth.estimateGas({
    from: address.address,
    to: to,
    data: data,
  });
  let gasPrice = await web3.eth.getGasPrice();

  const transactionObject: TransactionConfig = {
    gas: gas,
    gasPrice: gasPrice,
    to,
    value: "0x00",
    data: data,
    from: address.address,
  };

  if (nonce) {
    transactionObject["nonce"] = nonce;
  }

  if (isSimulate) {
    const simulateData = simulateCallTransaction(connection, transactionObject);
    if (simulateData) {
      return true;
    } else {
      return false;
    }
  }

  return new Promise((resolve, reject) => {
    web3.eth.accounts.signTransaction(
      transactionObject,
      privateKey,
      async (err: any, signedTx: any) => {
        if (err) {
          console.log(
            "-----------nonce-----------",
            nonce,
            "-----------txObj-----------",
            transactionObject,
            "-----------signTransaction-----------",
            err.message,
            err.stack
          );
          return reject(err);
        } else {
          if (signedTx.rawTransaction) {
            await web3.eth.sendSignedTransaction(
              signedTx.rawTransaction,
              (err, res) => {
                if (err) {
                  console.log(
                    "-----------nonce-----------",
                    nonce,
                    "-----------signedTx.transactionHash-----------",
                    signedTx.transactionHash,
                    "-----------sendSignedTransaction-----------",
                    err.message,
                    err.stack
                  );
                  return reject(err);
                }
              }
            );
            if (signedTx.transactionHash) {
              const res = await getTransactionReceiptMined(
                connection,
                signedTx.transactionHash
              );

              // const abi = getAbi(to);
              // const decoder = new InputDataDecoder(abi);
              // const inputDecoded = decoder.decodeData(data);
              resolve(res);
            }
          }
        }
      }
    );
  });
};

const getTransactionReceiptMined = (
  connection: Connection,
  txHash: string,
  interval = 500
): Promise<TransactionReceipt> => {
  const web3 = connection.web3;
  return new Promise((resolve, reject) => {
    const transactionReceiptAsync = (_resolve: any, _reject: any) => {
      web3.eth.getTransactionReceipt(txHash, (error: any, receipt: any) => {
        if (error) {
          reject(error);
        } else if (receipt == null) {
          setTimeout(
            () => transactionReceiptAsync(_resolve, _reject),
            interval
          );
        } else {
          resolve(receipt);
        }
      });
    };
    transactionReceiptAsync(resolve, reject);
  });
};

const checkIsContract = async (connection: Connection, address: string) => {
  let code = await connection.web3.eth.getCode(address);
  return code !== "0x";
};

const soliditySha3 = (connection: Connection, data: any) =>
  connection.web3.utils.soliditySha3(data) || "";

const simulateCallTransaction = async (connection: Connection, data: any) => {
  try {
    const result = await connection.web3.eth.call(data);
    return result;
  } catch (error) {
    throw error;
  }
};
export {
  signAndSendTransaction,
  checkIsContract,
  soliditySha3,
  simulateCallTransaction,
};

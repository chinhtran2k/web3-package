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
  nonce?: number
): Promise<TransactionReceipt> => {
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

//   if (isEstimate) {
//     return await connection.web3.eth.estimateGas(transactionObject);
//   }

  return new Promise((resolve, reject) => {
    web3.eth.accounts.signTransaction(
      transactionObject,
      privateKey,
      async (err, signedTx) => {
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

const soliditySha3 = (connection: Connection, data: any) =>
  connection.web3.utils.soliditySha3(data) || "";

export { signAndSendTransaction, soliditySha3 };
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.soliditySha3 = exports.signAndSendTransaction = void 0;
// const getAbi = (address) => {
//   try {
//     return Object.values(CONFIG).filter((e) => e.address == address)[0].abi;
//   } catch (error) {
//     console.log(`getAbi() error: ${error.message}`);
//     return [];
//   }
// };
var signAndSendTransaction = function (connection, data, to, privateKey, nonce) { return __awaiter(void 0, void 0, void 0, function () {
    var web3, address, gas, gasPrice, transactionObject;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                web3 = connection.web3;
                address = web3.eth.accounts.privateKeyToAccount(privateKey);
                return [4 /*yield*/, web3.eth.estimateGas({
                        from: address.address,
                        to: to,
                        data: data
                    })];
            case 1:
                gas = _a.sent();
                return [4 /*yield*/, web3.eth.getGasPrice()];
            case 2:
                gasPrice = _a.sent();
                transactionObject = {
                    gas: gas,
                    gasPrice: gasPrice,
                    to: to,
                    value: "0x00",
                    data: data,
                    from: address.address
                };
                if (nonce) {
                    transactionObject["nonce"] = nonce;
                }
                //   if (isEstimate) {
                //     return await connection.web3.eth.estimateGas(transactionObject);
                //   }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        web3.eth.accounts.signTransaction(transactionObject, privateKey, function (err, signedTx) { return __awaiter(void 0, void 0, void 0, function () {
                            var res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!err) return [3 /*break*/, 1];
                                        console.log("-----------nonce-----------", nonce, "-----------txObj-----------", transactionObject, "-----------signTransaction-----------", err.message, err.stack);
                                        return [2 /*return*/, reject(err)];
                                    case 1:
                                        if (!signedTx.rawTransaction) return [3 /*break*/, 4];
                                        return [4 /*yield*/, web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (err, res) {
                                                if (err) {
                                                    console.log("-----------nonce-----------", nonce, "-----------signedTx.transactionHash-----------", signedTx.transactionHash, "-----------sendSignedTransaction-----------", err.message, err.stack);
                                                    return reject(err);
                                                }
                                            })];
                                    case 2:
                                        _a.sent();
                                        if (!signedTx.transactionHash) return [3 /*break*/, 4];
                                        return [4 /*yield*/, getTransactionReceiptMined(connection, signedTx.transactionHash)];
                                    case 3:
                                        res = _a.sent();
                                        // const abi = getAbi(to);
                                        // const decoder = new InputDataDecoder(abi);
                                        // const inputDecoded = decoder.decodeData(data);
                                        resolve(res);
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                    })];
        }
    });
}); };
exports.signAndSendTransaction = signAndSendTransaction;
var getTransactionReceiptMined = function (connection, txHash, interval) {
    if (interval === void 0) { interval = 500; }
    var web3 = connection.web3;
    return new Promise(function (resolve, reject) {
        var transactionReceiptAsync = function (_resolve, _reject) {
            web3.eth.getTransactionReceipt(txHash, function (error, receipt) {
                if (error) {
                    reject(error);
                }
                else if (receipt == null) {
                    setTimeout(function () { return transactionReceiptAsync(_resolve, _reject); }, interval);
                }
                else {
                    resolve(receipt);
                }
            });
        };
        transactionReceiptAsync(resolve, reject);
    });
};
var soliditySha3 = function (connection, data) {
    return connection.web3.utils.soliditySha3(data) || "";
};
exports.soliditySha3 = soliditySha3;

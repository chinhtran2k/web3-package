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
exports.DDR = void 0;
var config_1 = require("../../config");
var utils_1 = require("../../utils");
var decodeLogs = require("abi-parser-pack").decodeLogs;
var DDR = /** @class */ (function () {
    function DDR(connection) {
        this.connection = connection;
        this.ddr = new this.connection.web3.eth.Contract(config_1.CONFIG.DDR.abi, config_1.CONFIG.DDR.address);
        this.authenticator = new connection.web3.eth.Contract(config_1.CONFIG.Authenticator.abi, config_1.CONFIG.Authenticator.address);
        this.claimHolder = new this.connection.web3.eth.Contract(config_1.CONFIG.ClaimHolder.abi);
    }
    DDR.prototype.createAuthentication = function (identity) {
        return __awaiter(this, void 0, void 0, function () {
            var abicreateAuthentication;
            return __generator(this, function (_a) {
                abicreateAuthentication = this.authenticator.methods.createAuthentication(identity).call();
                return [2 /*return*/, abicreateAuthentication];
            });
        });
    };
    DDR.prototype.mintDDR = function (hashedData, ddrRawId, ddrPatientRawId, uri, patientDID, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var account, nonce, mintAbi, executeAbi, tx, decodedLogs, eventLogs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        account = this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
                        return [4 /*yield*/, this.connection.web3.eth.getTransactionCount(account.address)];
                    case 1:
                        nonce = _a.sent();
                        return [4 /*yield*/, this.ddr.methods
                                .mint(hashedData, ddrRawId, ddrPatientRawId, uri, patientDID)
                                .encodeABI()];
                    case 2:
                        mintAbi = _a.sent();
                        executeAbi = this.claimHolder.methods
                            .execute(config_1.CONFIG.DDR.address, 0, mintAbi)
                            .encodeABI();
                        return [4 /*yield*/, (0, utils_1.signAndSendTransaction)(this.connection, executeAbi, config_1.CONFIG.ClaimHolder.address, privateKey)];
                    case 3:
                        tx = _a.sent();
                        return [4 /*yield*/, decodeLogs(tx.logs, config_1.CONFIG.ClaimHolder.abi)];
                    case 4:
                        decodedLogs = _a.sent();
                        return [4 /*yield*/, decodedLogs.filter(
                            // (log: any) => log.name === "MintedDDR",
                            // (log: any) => log.name === "ApprovalShareDDR",
                            // (log: any) => log.name === "DDRTokenLocked"
                            function (log) { return log.name === "ExecutionRequested"; })];
                    case 5:
                        eventLogs = _a.sent();
                        return [2 /*return*/, { tx: tx, eventLogs: eventLogs }];
                }
            });
        });
    };
    DDR.prototype.mintBatchDDR = function (hashValues, ddrRawIds, uris, patientDID, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var account, nonce, abiMintBatch, abiMintBatchExecute, receipt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        account = this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
                        return [4 /*yield*/, this.connection.web3.eth.getTransactionCount(account.address)];
                    case 1:
                        nonce = _a.sent();
                        abiMintBatch = this.ddr.methods.mintBatch(hashValues, ddrRawIds, uris, patientDID).encodeABI();
                        abiMintBatchExecute = this.claimHolder.methods.execute(config_1.CONFIG.ClaimHolder.address, 0, abiMintBatch).encodeABI();
                        return [4 /*yield*/, (0, utils_1.signAndSendTransaction)(this.connection, abiMintBatchExecute, config_1.CONFIG.ClaimHolder.address, privateKey, nonce)];
                    case 2:
                        receipt = _a.sent();
                        return [2 /*return*/, receipt];
                }
            });
        });
    };
    DDR.prototype.SharedDDR = function (ddrTokenId, patientDID, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var account, nonce, abiMintBatch, receipt, decodedLogs, eventLogs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        account = this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
                        return [4 /*yield*/, this.connection.web3.eth.getTransactionCount(account.address)];
                    case 1:
                        nonce = _a.sent();
                        abiMintBatch = this.ddr.methods.shareDDR(ddrTokenId, patientDID).encodeABI();
                        return [4 /*yield*/, (0, utils_1.signAndSendTransaction)(this.connection, abiMintBatch, config_1.CONFIG.DDR.address, privateKey, nonce)];
                    case 2:
                        receipt = _a.sent();
                        return [4 /*yield*/, decodeLogs(receipt.logs, config_1.CONFIG.DDR.abi)];
                    case 3:
                        decodedLogs = _a.sent();
                        return [4 /*yield*/, decodedLogs.filter(function (log) { return log.name === "ApprovalShareDDR"; })];
                    case 4:
                        eventLogs = _a.sent();
                        return [2 /*return*/, { receipt: receipt, eventLogs: eventLogs }];
                }
            });
        });
    };
    DDR.prototype.disclosureConsentDDRFromHospital = function (ddrTokenIds, hospitalDID, privateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var account, nonce, abiLockDDR, receipt, decodedLogs, eventLogs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        account = this.connection.web3.eth.accounts.privateKeyToAccount(privateKey);
                        return [4 /*yield*/, this.connection.web3.eth.getTransactionCount(account.address)];
                    case 1:
                        nonce = _a.sent();
                        abiLockDDR = this.ddr.methods.disclosureConsentDDRFromHospital(ddrTokenIds, hospitalDID).encodeABI();
                        return [4 /*yield*/, (0, utils_1.signAndSendTransaction)(this.connection, abiLockDDR, config_1.CONFIG.DDR.address, privateKey, nonce)];
                    case 2:
                        receipt = _a.sent();
                        return [4 /*yield*/, decodeLogs(receipt.logs, config_1.CONFIG.DDR.abi)];
                    case 3:
                        decodedLogs = _a.sent();
                        return [4 /*yield*/, decodedLogs.filter(function (log) { return log.name === "ApprovalDisclosureConsentDDR"; })];
                    case 4:
                        eventLogs = _a.sent();
                        return [2 /*return*/, { receipt: receipt, eventLogs: eventLogs }];
                }
            });
        });
    };
    return DDR;
}());
exports.DDR = DDR;

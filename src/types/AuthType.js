"use strict";
exports.__esModule = true;
exports.ClaimTypes = exports.Schemes = exports.KeyPurposes = void 0;
var KeyPurposes;
(function (KeyPurposes) {
    KeyPurposes[KeyPurposes["MANAGEMENT"] = 1] = "MANAGEMENT";
    KeyPurposes[KeyPurposes["ACTION"] = 2] = "ACTION";
    KeyPurposes[KeyPurposes["CLAIM_SIGNER"] = 3] = "CLAIM_SIGNER";
    KeyPurposes[KeyPurposes["ENCRYPTION"] = 4] = "ENCRYPTION";
})(KeyPurposes = exports.KeyPurposes || (exports.KeyPurposes = {}));
var Schemes;
(function (Schemes) {
    Schemes[Schemes["ECDSA"] = 1] = "ECDSA";
    Schemes[Schemes["RSA"] = 2] = "RSA";
    Schemes[Schemes["CONTRACT_CALL"] = 3] = "CONTRACT_CALL";
    Schemes[Schemes["SELF_CLAIM"] = 4] = "SELF_CLAIM";
})(Schemes = exports.Schemes || (exports.Schemes = {}));
var ClaimTypes;
(function (ClaimTypes) {
    ClaimTypes[ClaimTypes["PATIENT"] = 1] = "PATIENT";
    ClaimTypes[ClaimTypes["PHARMACY"] = 2] = "PHARMACY";
    ClaimTypes[ClaimTypes["HOSPITAL"] = 3] = "HOSPITAL";
})(ClaimTypes = exports.ClaimTypes || (exports.ClaimTypes = {}));

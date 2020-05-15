const crypto = require("crypto");

// - Serialize JSON to a string.
// - Pretty print
//   - No limit to object depth.
//   - Two spaces as identation.
const serialize = (object) => JSON.stringify(object, null, 2);

// - Take object as input.
// - Serialize.
// - Calculate SHA256 hash.
// - Encode bytes as base64.
exports.sha256 = (input) =>
  crypto
    .createHash("sha256")
    .update(serialize(input))
    .digest()
    .toString("base64");

// - Take no input.
// - Return { publicKey, sign() }
exports.ed25519 = () => {
  const keyPair = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "der",
    },
  });

  return {
    // - Skip DER encoding weirdness, only get last 32 bytes.
    // - Encode bytes as base64.
    publicKey: keyPair.publicKey.slice(-32).toString("base64"),

    // - Take object as input.
    // - Serialize.
    // - Sign with keys.
    // - Encode bytes as base64.
    sign: (input) =>
      crypto
        .sign(null, Buffer.from(serialize(input)), {
          key: keyPair.privateKey,
          format: "der",
          type: "pkcs8",
        })
        .toString("base64"),
  };
};

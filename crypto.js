// Node.js uses OpenSSL under the hood, which means that we have to jump through
// some hoops to satisfy ASN.1 encoding. Alternatives like libsodium don't have
// this problem, but I wanted to try to use only the standard library to avoid
// all of the problems you get with native modules via npm.
const crypto = require("crypto");

// These magic bytes help us encode our public key integer as ASN.1 DER. 🤷
const derEncode = (base64PublicKey) => `MCowBQYDK2VwAyEA${base64PublicKey}`;

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
      format: "der",
      type: "spki",
    },
    privateKeyEncoding: {
      format: "der",
      type: "pkcs8",
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
    verify: (data, key, signature) =>
      crypto.verify(
        null, // Auto-detect Ed25519 key type.
        Buffer.from(serialize(data)),
        {
          key: Buffer.from(derEncode(key), "base64"),
          format: "der",
          type: "spki",
        },
        Buffer.from(signature, "base64")
      ),
  };
};

const crypto = require("crypto");

const sha256 = (input) => crypto.createHash("sha256").update(input).digest();

// Create a keypair and expose two methods:
//
// - getPublicKey() -> Buffer
// - sign(input: Buffer) -> Buffer
const createKeys = () => {
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
    getPublicKey: () => keyPair.publicKey.slice(-32),
    sign: (input) =>
      crypto.sign(null, Buffer.from(input), {
        key: keyPair.privateKey,
        format: "der",
        type: "pkcs8",
      }),
  };
};

// Create an author (with state) and expose one method:
//
// - createMessage(content: Object) -> Object
exports.createAuthor = () => {
  const keys = createKeys();
  let sequence = 1;
  let previous = null;

  const publicKeyBase64 = keys.getPublicKey().toString("base64");
  const author = `@${publicKeyBase64}.ed25519`;

  const messages = [];

  return {
    createMessage: (content) => {
      const value = {
        previous,
        sequence,
        author,
        timestamp: Date.now(),
        hash: "sha256",
        content,
      };

      // TODO: Can we avoid passing through to `crypto.createPrivateKey()` here?
      const payload = JSON.stringify(value, null, 2);

      const signature = keys.sign(payload).toString("base64");

      // The `.sig.ed25519` suffix is customary.
      value.signature = `${signature}.sig.ed25519`;

      // We get the key *after* the signature. This has made a lot of people
      // very angry and been widely regarded as a bad move.
      const hash = sha256(JSON.stringify(value, null, 2)).toString("base64");

      // The `%` prefix and `.sha256` suffix are customary.
      const key = `%${hash}.sha256`;

      previous = key;
      sequence += 1;

      const message = { key, value };
      messages.push(message);

      return message;
    },
  };
};

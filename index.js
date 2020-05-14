const crypto = require("crypto");

let sequence = 1;
let previous = null;

const createAuthor = () => {
  // Create a pair of public and private keys, which will be used for:
  //
  // - Signing public messages.
  // - Decrypting private messages.
  //
  // The public key is meant to be shared, the private key MUST NEVER BE SHARED.
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

  // I don't remember why we only want the last 32 characters, but we
  // need to convert it to base64 and then decorate it with the `@` prefix
  // and the `.ed25519` suffix.
  const publicKeyBase64 = keyPair.publicKey.slice(-32).toString("base64");
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

      const signature = crypto
        .sign(null, Buffer.from(payload), {
          key: keyPair.privateKey,
          format: "der",
          type: "pkcs8",
        })
        .toString("base64");

      // The .ed25519 suffix is customary.
      value.signature = `${signature}.ed25519`;

      // We get the key *after* the signature. This has made a lot of people
      // very angry and been widely regarded as a bad move.
      const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(value, null, 2))
        .digest()
        .toString("base64");

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

const alice = createAuthor();

const hello = alice.createMessage({
  type: "post",
  text: "hello",
  source: "https://github.com/christianbundy/example-ssb",
});
const world = alice.createMessage({
  type: "post",
  text: "world",
  source: "https://github.com/christianbundy/example-ssb",
});

console.log(JSON.stringify([hello, world], null, 2));

const { sha256, ed25519 } = require("./crypto");

exports.createAuthor = () => {
  const keys = ed25519();

  // Current state.
  let previous = null;
  let sequence = 1;

  return {
    createMessage: (content) => {
      // Create unsigned message.
      const value = {
        previous,
        sequence,
        author: `@${keys.publicKey}.ed25519`,
        timestamp: Date.now(),
        hash: "sha256",
        content,
      };

      // Create signature.
      const signature = keys.sign(value);

      // Verify signature.
      if (keys.verify(value, keys.publicKey, signature) === false) {
        throw new Error("Invalid signature!");
      }

      // Insert signature.
      value.signature = `${signature}.sig.ed25519`;

      // Create identifier.
      const key = `%${sha256(value)}.sha256`;

      // Update state.
      previous = key;
      sequence += 1;

      // Full 'entry' returned for convenience.
      return {
        key,
        value,
      };
    },
  };
};

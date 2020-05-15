const { sha256, ed25519 } = require("./crypto");

// Create author, identified by ed25519 keypair and a list of messages.
exports.createAuthor = () => {
  const keys = ed25519();
  const messages = [];

  const getPreviousMessageKey = () => {
    if (messages.length === 0) {
      return null;
    } else {
      const previousMessage = messages[messages.length - 1];
      return previousMessage.key;
    }
  };

  return {
    createMessage: (content) => {
      const value = {
        previous: getPreviousMessageKey(),
        sequence: messages.length + 1,
        author: `@${keys.publicKey}.ed25519`,
        timestamp: Date.now(),
        hash: "sha256",
        content,
      };

      // Calculate a signature and insert it into the message.
      value.signature = `${keys.sign(value)}.sig.ed25519`;

      // Calculate a key, which is used as an identifier for `value`.
      const message = {
        key: `%${sha256(value)}.sha256`,
        value,
      };

      // Insert the message into the database.
      messages.push(message);

      return message;
    },
  };
};

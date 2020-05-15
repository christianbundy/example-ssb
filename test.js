const { createAuthor } = require("./");

const alice = createAuthor();

alice.createMessage({
  type: "post",
  text: "hello",
  source: "https://github.com/christianbundy/example-ssb",
});

alice.createMessage({
  type: "post",
  text: "world",
  source: "https://github.com/christianbundy/example-ssb",
});

const messages = alice.getMessages();

console.log(JSON.stringify(messages, null, 2));

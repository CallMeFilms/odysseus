module.exports = {
  handle: (client, db, command) => {
    command.respond("Pong!");
  },
  permissions: [],
  reject: (command) => {}
};
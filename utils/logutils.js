module.exports = {
  log: async (statement) => {
    console.log("[Log] " + statement);
  },
  error: async (statement, error) => {
    console.log("\n[Error] " + statement + "\n[Error] " + error);
  },
  cmd: (command) => {
    console.log("\n[Log] Command: " + command.cmd + "\n[Log] Arguments: " + JSON.stringify(command.args).split("\"").join("").split(",").join(", ") + "\n[Log] Sender: " + command.author.tag);
  }
};
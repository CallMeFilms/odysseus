const logutils = require("../utils/logutils.js");

module.exports = async (client, db, msg) => {
  if(msg.content.startsWith(client.config.prefix)) {
    const command = {
      cmd: msg.content.split(" ")[0].slice(client.config.prefix.length).toLowerCase(),
      args: msg.content.split(" ").slice(1),
      author: msg.author,
      channel: msg.channel,
      tags: msg.tags,
      id: msg.id,
      reactions: msg.reactions,
      embeds: msg.embeds,
      delete: () => {
        msg.delete();
      },
      respond: async (response) => {
        return new Promise(resolve => {
          msg.channel.send(response).then((message) => {
            resolve(message);
          });
        });
      }
    };
    logutils.cmd(command);
    try {
      const handler = require("../commands/" + command.cmd + ".js");
      if(!msg.channel.guild.members.get(msg.author.id).hasPermission(handler.permissions)) {
        handler.reject(command);
        return;
      }
      handler.handle(client, db, command);
    } catch (err) {
      logutils.error("An error occured while attempting to handle a command", err.message);
    }
    return;
  }
};
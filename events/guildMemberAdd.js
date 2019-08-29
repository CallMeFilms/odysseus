const discord = require("discord.js");
const dbutils = require("../utils/dbutils.js");
const disutils = require("../utils/disutils.js");
const logutils = require("../utils/logutils.js");

module.exports = async (client, db, member) => {
  const guild = member.guild;
  let invite;
  let invites = await guild.fetchInvites();
  for(var curInvite of invites.array()) {
    let oldInvite = client.invites[guild.id].get(curInvite.code);
    if(oldInvite.uses === curInvite.uses - 1) {
      client.invites[guild.id].set(curInvite.code, curInvite);
      invite = curInvite;
    }
  }
  const welcomeChan = guild.channels.find(chan => chan.name.toLowerCase() === "welcome");
  if(welcomeChan) {
    let welcomeMessages = client.config.welcome_messages;
    let welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    welcomeChan.send(welcomeMsg.replace("{user}", member.user).replace("{inviter}", invite.inviter.username).replace("{members}", guild.members.array().length));
  }
  const memberRole = guild.roles.find(role => role.name.toLowerCase() === "member");
  if(memberRole) member.addRole(memberRole);
  let embedFields = [
    {
      "name":"Who Are We?",
      "value":"Odyssey Services is your premier freelance service team dedicated to providing you quality services at an affordable price. From Minecraft plugins to Discord setups, we'll provide you with whatever you need at a price that makes sense to you.",
      "inline":false,
    },
    {
      "name":"Where Can I Find More Info?",
      "value":"If you take a look at our #information channel, you can find anything you might need to know. You can also use our #support channel to speak to a representative.",
      "inline":false,
    }
  ];
  disutils.sendEmbedWithImage("Welcome to " + guild.name + "!", "Here's what you'll need to know about " + guild.name + ".", embedFields, "https://cdn.glitch.com/8ec88324-e190-4447-a999-69198d23a4c3%2Fexclamationmark.png?v=1564127118890", member.user);
  await dbutils.addUser(db, member.user.id, invite.inviter.id, invite.code);
  dbutils.addInviteUse(db, invite.inviter.id);
}
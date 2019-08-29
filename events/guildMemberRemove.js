const dbutils = require("../utils/dbutils.js");
const logutils = require("../utils/logutils.js");

module.exports = async (client, db, member) => {
  const guild = member.guild;
  const leaveChan = guild.channels.find(chan => chan.name.toLowerCase() === "leave");
  if(leaveChan) {
    leaveChan.send(member.user.tag + " has left " + guild.name);
  }
  let invite = await dbutils.getInvite(db, member.id);
  let newInvite;
  let invites = await guild.fetchInvites();
  for(var curInvite of invites.array()) {
    if(curInvite.code === invite.code) {
      newInvite = curInvite;
    }
  }
  client.invites[guild.id].set(invite.code, newInvite);
  dbutils.removeInviteUse(db, invite.inviter_id);
}
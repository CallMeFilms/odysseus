let dbutils = require("../utils/dbutils.js");
let disutils = require("../utils/disutils.js");
let logutils = require("../utils/logutils.js");
let forms = require("../forms.json");

module.exports = async (client, db) => {
  logutils.log("Logged into " + client.user.tag);
  let guilds = client.guilds.array();
  client.invites = [];
  for(var guild of guilds) {
    if(guild.id === "348999247749971968") {
      client.odsy = guild;
    }
    client.invites[guild.id] = await guild.fetchInvites();
  }
  let newTicketChan = client.odsy.channels.find(chan => chan.name === "new-ticket");
  if(newTicketChan) {
    let newTicketMsg;
    await newTicketChan.fetchMessages().then(async (messages) => {
      messages = messages.array();
      if(messages.length === 0) {
        return;
      }
      if(messages.length > 1 && messages[messages.length - 1].author.id === client.user.id) {
        await newTicketChan.bulkDelete(messages.length - 1);
      } else if(messages.length > 1) {
        await newTicketChan.bulkDelete(messages.length);
        return;
      }
      newTicketMsg = messages[messages.length - 1];
    });
    let pluginEmoji = client.odsy.emojis.find(emoji => emoji.name === "plugin");
    let botEmoji = client.odsy.emojis.find(emoji => emoji.name === "bot");
    let minecraftEmoji = client.odsy.emojis.find(emoji => emoji.name === "minecraft");
    let discordEmoji = client.odsy.emojis.find(emoji => emoji.name === "discord");
    if(!newTicketMsg) {
      await disutils.sendEmbedWithImage("Create a ticket", "React to this message to create a new ticket using the emoji corresponding to the service you'd like to request.\n\n:question: **Support**\n\n" + pluginEmoji + " **Plugin Development**\n\n" + botEmoji + " **Bot Development**\n\n" + minecraftEmoji + " **Minecraft Configurations**\n\n" + discordEmoji + " **Discord Setups**\n\n:art: **Graphic Design**\n\n:computer: **Web Development**\n\n:hammer: **Minecraft Build**", [], "https://cdn.glitch.com/8ec88324-e190-4447-a999-69198d23a4c3%2Fexclamationmark.png?v=1564127118890", newTicketChan).then(async msg => {
        newTicketMsg = msg;
      });
    } else {
      await disutils.editEmbedWithImage(newTicketMsg, "Create a ticket", "React to this message to create a new ticket using the emoji corresponding to the service you'd like to request.\n\n:question: **Support**\n\n" + pluginEmoji + " **Plugin Development**\n\n" + botEmoji + " **Bot Development**\n\n" + minecraftEmoji + " **Minecraft Configurations**\n\n" + discordEmoji + " **Discord Setups**\n\n:art: **Graphic Design**\n\n:computer: **Web Development**\n\n:hammer: **Minecraft Build**", [], "https://cdn.glitch.com/8ec88324-e190-4447-a999-69198d23a4c3%2Fexclamationmark.png?v=1564127118890", newTicketChan);
    }
    await newTicketMsg.clearReactions();
    await newTicketMsg.react("❓");
    await newTicketMsg.react(pluginEmoji);
    await newTicketMsg.react(botEmoji);
    await newTicketMsg.react(minecraftEmoji);
    await newTicketMsg.react(discordEmoji);
    await newTicketMsg.react("🎨");
    await newTicketMsg.react("💻");
    await newTicketMsg.react("🔨");
    const ticketCollector = newTicketMsg.createReactionCollector((reaction, user) => !user.bot, {});
    ticketCollector.on("collect", async reaction => {
      let users = reaction.users.array();
      let reactor = users[users.length - 1];
      reaction.remove(reactor);
      let commissionsChan = await client.odsy.channels.find(chan => chan.name === "commissions");
      let answers;
      let commission = {
        customer_id:reactor.id,
        "request":{},
        "accepted":false,
        "completed":false,
        "paid":false
      };
      let embedFields;
      switch(reaction.emoji.name) {
        case "❓":
          let supportChan = client.odsy.channels.find(chan => chan.name === "support-" + reactor.username.toLowerCase().replace(" ", "-"));
          if(supportChan) {
            disutils.sendError("Error!", "You already have a support channel open in Odyssey Services.", [], reactor);
            return;
          }
          let supportCategory = client.odsy.channels.find(chan => chan.name.toLowerCase() === "support" && chan.type === "category");
          let supportRole = client.odsy.roles.find(role => role.name.toLowerCase() === "support");
          supportChan = await client.odsy.createChannel("support-" + reactor.username, {
            type:"text",
            permissionOverwrites: [
              { id:client.odsy.id, deny:["VIEW_CHANNEL"], allow:[] },
              { id:supportRole.id, deny:[], allow:["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"] },
              { id:reactor.id, deny:[], allow:["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"] }
            ]
          });
          await supportChan.setParent(supportCategory);
          await supportChan.send(":exclamation:A member of our support team will assist you shortly.");
          supportChan.send(reactor.toString() + " " + supportRole.toString()).then(message => {
            message.delete();
          });
          return;
        case "plugin":
          answers = await disutils.sendForm(reactor, forms.plugin);
          let pluginDevRole = client.odsy.roles.find(role => role.name === "Plugin Developer");
          commissionsChan.send(pluginDevRole.toString()).then(message => message.delete());
          embedFields = [
            {
              "name":"Type",
              "value":"Plugin",
              "inline":true
            },
            {
              "name":"Version",
              "value":answers[1],
              "inline":true
            }
          ];
          commission.request = {
            "type":"plugin",
            "version":answers[1]
          }
          break;
        case "bot":
          answers = await disutils.sendForm(reactor, forms.bot);
          let botDevRole = client.odsy.roles.find(role => role.name === "Bot Developer");
          commissionsChan.send(botDevRole.toString()).then(message => message.delete());
          embedFields = [
            {
              "name":"Type",
              "value":"Bot",
              "inline":true
            }
          ];
          commission.request = {
            "type":"bot"
          };
          break;
        case "minecraft":
          answers = await disutils.sendForm(reactor, forms.configurations);
          let configsRole = client.odsy.roles.find(role => role.name === "Configurations");
          commissionsChan.send(configsRole.toString()).then(message => message.delete());
          embedFields = [
            {
              "name":"Type",
              "value":"Minecraft Configurations",
              "inline":true
            }
          ];
          commission.request = {
            "type":"configurations"
          };
          break;
        case "discord":
          answers = await disutils.sendForm(reactor, forms.setups);
          let discordSetupsRole = client.odsy.roles.find(role => role.name === "Discord Setups");
          commissionsChan.send(discordSetupsRole.toString()).then(message => message.delete());
          embedFields = [
            {
              "name":"Type",
              "value":"Discord Setups",
              "inline":true
            },
            {
              "name":"Any Reference?",
              "value":answers[1],
              "inline":true
            }
          ];
          commission.request = {
            "type":"setups",
            "guild_invite":answers[2],
            "reference_invite":answers[1]
          };
          break;
        case "🎨":
          answers = await disutils.sendForm(reactor, forms.graphics);
          let graphicsRole = client.odsy.roles.find(role => role.name === "Graphic Designer");
          commissionsChan.send(graphicsRole.toString()).then(message => message.delete());
          embedFields = [
            {
              "name":"Type",
              "value":"Graphic Design",
              "inline":true
            }
          ];
          commission.request = {
            "type":"graphics"
          };
          break;
        case "💻":
          answers = await disutils.sendForm(reactor, forms.web);
          let webDevRole = client.odsy.roles.find(role => role.name === "Web Developer");
          commissionsChan.send(webDevRole.toString()).then(message => message.delete());
          embedFields = [
            {
              "name":"Type",
              "value":"Web Development",
              "inline":true
            }
          ];
          commission.request = {
            "type":"web"
          };
          break;
        case "🔨":
          answers = await disutils.sendForm(reactor, forms.web);
          let builderRole = client.odsy.roles.find(role => role.name === "Builder");
          commissionsChan.send(builderRole.toString()).then(message => message.delete());
          embedFields = [
            {
              "name":"Type",
              "value":"Web Development",
              "inline":true
            }
          ];
          commission.request = {
            "type":"web"
          };
          break;
        default:
          return;
      }
      embedFields.push({
        "name":"Description",
        "value":answers[0],
        "inline":true
      });
      embedFields.push({
        "name":"Any Extra Comments?",
        "value":answers[answers.length - 2],
        "inline":true
      });
      commission.customer_email = answers[answers.length - 1];
      commission.request.description = answers[0];
      commission.request.comments = answers[answers.length - 2];
      let commissionMsg = await disutils.sendEmbed("Commission Request", "", embedFields, commissionsChan);
      commission.message_id = commissionMsg.id;
      await commissionMsg.react("✅");
      await dbutils.addCommission(db, commission);
      let customer = reactor;
      let collector = commissionMsg.createReactionCollector((reaction, user) => !user.bot && reaction.emoji.name === "✅");
      collector.on("collect", async reaction => {
        let users = reaction.users.array();
        let reactor = users[users.length - 1];
        reaction.message.delete();
        let commissionCategory = client.odsy.channels.find(chan => chan.name.toLowerCase() === "commissions" && chan.type === "category");
        let commissionChannel = await client.odsy.createChannel(customer.username, {
          "type":"text",
          permissionOverwrites: [
            { id:client.odsy.id, deny:["VIEW_CHANNEL"], allow:[] },
            { id:customer.id, deny:[], allow:["VIEW_CHANNEL", "SEND_MESSAGES"] },
            { id:reactor.id, deny:[], allow:["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"] }
          ]
        });
        await commissionChannel.setParent(commissionCategory);
        await commissionChannel.setName(customer.username + "-" + commissionChannel.id.split("").splice(5, 5));
        await commissionChannel.send(":exclamation:" + reactor.toString() + " has accepted your request. All interactions regarding the commission and its completion may be done here.");
        commissionChannel.send(customer.toString()).then(message => {
          message.delete();
        });
        commission.accepted = true;
        dbutils.updateCommission(db, commission);
      });
    });
  }
};
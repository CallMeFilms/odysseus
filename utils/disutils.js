const discord = require("discord.js");
const logutils = require("../utils/disutils.js");
const pkg = require("../package.json");

module.exports = {
  sendEmbedWithImage: async (title, description, fields, imageURL, channel) => {
    return new Promise(resolve => {
      let embed = new discord.RichEmbed({
        "title": title,
        "description": description,
        "color": 14177048,
        "fields": fields,
        "footer": {
          "text": "Odysseus v" + pkg.version
        },
        "thumbnail": {
          "url": imageURL
        }
      });
      embed.setTimestamp(new Date());
      channel.send(embed).then(message => resolve(message));
    });
  },
  sendEmbed: async (title, description, fields, channel) => {
    return new Promise(resolve => {
      let embed = new discord.RichEmbed({
        "title": title,
        "description": description,
        "color": 14177048,
        "fields": fields,
        "footer": {
          "text": "Odysseyus v" + pkg.version
        },
        "thumbnail": {
          "url": "https://i.imgur.com/QaqOKNh.png"
        }
      });
      embed.setTimestamp(new Date());
      channel.send(embed).then(message => resolve(message));
    });
  },
  sendError: async (title, description, elements, channel) => {
    return new Promise((resolve, reject) => {
      let embed = new discord.RichEmbed({
        "title": title,
        "description": description,
        "color": 14177048,
        "elements": elements,
        "footer": {
          "text": "Vico | v0.1"
        },
        "thumbnail": {
          "url": "https://i.imgur.com/Bfs90K5.png"
        }
      });
      embed.setTimestamp(new Date());
      channel.send(embed).then(message => resolve(message));
    });
  },
  editEmbed: async (message, title, description, fields, channel) => {
    return new Promise((resolve, reject) => {
      message.edit({
        "embed": {
          "title": title,
          "description": description,
          "color": 14177048,
          "fields": fields,
          "footer": {
            "text": "Odysseus v" + pkg.version
          },
          "thumbnail": {
            "url": "https://i.imgur.com/QaqOKNh.png"
          }
        }
      }).then(msg => resolve(msg)).catch(reject);
    });
  },
  editEmbedWithImage: async (message, title, description, fields, imageURL, channel) => {
    return new Promise((resolve, reject) => {
      message.edit({
        "embed": {
          "title": title,
          "description": description,
          "color": 14177048,
          "fields": fields,
          "footer": {
            "text": "Odysseus v" + pkg.version
          },
          "thumbnail": {
            "url": imageURL
          }
        }
      }).then(msg => resolve(msg)).catch(reject);
    });
  },
  sendForm: async (user, form) => {
    return new Promise(async (resolve, reject) => {
      let invalidity = isValidForm(form);
      if(invalidity) {
        logutils.error("An error occured while validating a form", "Form '" + form.name + "' is invalid as " + invalidity);
        reject();
        return;
      }
      if(!user) {
        reject();
        return;
      }
      let dmChan;
      let counter = 0;
      let quests = form.questions;
      await user.send(quests[0].question).then((msg) => {
        dmChan = msg.channel;
      });
      let answers = [];
      let collector = new discord.MessageCollector(dmChan, msg => !msg.author.bot, { maxMatches:1000000 });
      let timeoutFunc = () => {
        collector.stop();
        module.exports.sendError("", form.timeoutStatement, {}, user);
      };
      let timeout = setTimeout(timeoutFunc, form.timeout * 60000);
      collector.on("collect", msg => {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunc, form.timeout * 60000);
        let curQuest = quests[counter];
        let error;
        switch(curQuest.type) {
          case "int":
            let int = parseInt(msg.content);
            if(!int || msg.content === "0") {
              error = "Please provide a number";
            } else if(int < curQuest.min || int > curQuest.max) {
              error = "Please provide a number between " + curQuest.min + " and " + curQuest.max;
            }
            break;
          case "str":
            if(msg.content.length < curQuest.min || msg.content.length > curQuest.max) {
              error = "Please provide an answer between " + curQuest.min + " and " + curQuest.max + " characters";
            }
            break;
          case "money":
            try {
              let value = parseFloat(msg.content);
              var re = /\$[0-9]*\.[0-9]{1,2}/;
              if(value < curQuest.min || value > curQuest.max || !re.test(msg.content)) {
                error = "Please provide a valid amount of money in USD format: $00.00 that is at least $" + curQuest.min + " and no more than $" + curQuest.max + " USD";
              }
            } catch (err) {
              error = "Please provide a valid amount of money in USD format: $00.00 that is at least " + curQuest.min + " and no more than " + curQuest.max;
            }
            break;
          case "email":
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if(!re.test(msg.content)){
               error = "Please provide a valid email address.";
            }
            break;
        }
        if(error) {
          dmChan.send(error);
          return;
        }
        answers.push(msg.content);
        counter++;
        if(counter === quests.length) {
          collector.stop();
          if(!form.endStatement) {
            dmChan.send("Thank you for completing the " + form.name + " form");
          } else {
            dmChan.send(form.endStatement);
          }
          clearTimeout(timeout);
          resolve(answers);
          return;
        }
        dmChan.send(quests[counter].question);
      });
    });
  }
};

function isValidForm(form) {
  if(!form.name) {
    return "form has no name";
  }
  let quests = form.questions;
  if(!quests) {
    return "form has no questions";
  }
  if(typeof quests[Symbol.iterator] !== 'function') {
    return "form does not have iterable questions";
  }
  for(var i = 0; i < quests.length; i++) {
    let quest = quests[i];
    if(!quest.question) {
      return "form contains an invalid question at index " + i;
    }
    if(!quest.type) {
      return "form contains a question without a type at index " + i;
    }
    let type = quest.type;
    if((type === "str" || type === "int" || type === "date") && (quest.min >= quest.max)) {
      return "form contains a question with an invalid min and max at index " + i;
    }
  }
  return false;
}
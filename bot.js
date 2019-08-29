const fs = require("fs");
const discord = require("discord.js");
const dbutils = require("./utils/dbutils.js");
const logutils = require("./utils/logutils.js");

async function main() {
  const client = new discord.Client({ disableEveryone:true });

  client.config = require("./config.json");
  
  var db;
  var db = await dbutils.connect().catch((error) => {
    logutils.error("An error occured while attempting to connect to the database.", error.message);
  });
  db = db.db("odysseus");
  if(!db) {
    logutils.logerr("An error occured on start up.", "Could not connect to database.");
    return;
  };
  
  fs.readdir('./events', (error, files) => {
    if(error) throw error;
    files.forEach(file => {
      let handler = require("./events/" + file);
      let event = file.split('.')[0];
      client.on(event, (...args) => {
        handler(client, db, ...args).catch((error) => {
          logutils.error("An error occured while handling a " + event + " event.", error.stack);
        });
      });
    });
  });
  
  await client.login(client.config.token);
}

main();
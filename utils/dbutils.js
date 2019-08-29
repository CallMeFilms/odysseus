const MongoClient = require("mongodb").MongoClient;

module.exports = {
  connect: async () => {
    return new Promise((resolve, reject) => {
      MongoClient.connect("mongodb://97.90.112.19", { useNewUrlParser:true }, (error, database) => {
        if(error) {
          reject(error);
          return;
        }
        resolve(database);
      });
    });
  },
  getInvite: async (db, userID) => {
    return new Promise((resolve, reject) => {
      db.collection("users").findOne({ user_id:userID }, (error, user) => {
        if(error) {
          reject(error);
          return;
        }
        if(!user) {
          resolve(null);
          return;
        }
        resolve({ inviter_id:user.inviter_id,code:user.invite_code });
      });
    });
  },
  addUser: async (db, userID, inviterID, inviteCode) => {
    return new Promise((resolve, reject) => {
      db.collection("users").findOne({ user_id:userID }, (error, user) => {
        if(error) {
          reject(error);
          return;
        }
        if(user) {
          db.collection("users").updateOne({ user_id:userID }, { $set:{ inviter_id:inviterID,invite_code:inviteCode } }, (error, result) => {
            if(error) {
              reject(error);
              return;
            }
            resolve(result);
          });
          return;
        }
        db.collection("users").insertOne({ user_id:userID,inviter_id:inviterID,invite_code:inviteCode,invites:0 }, (error, result) => {
          if(error) {
            reject(error);
            return;
          }
          resolve(result);
        });
      });
    });
  },
  addInviteUse: async (db, userID) => {
    return new Promise((resolve, reject) => {
      db.collection("users").updateOne({ user_id:userID }, { $inc:{ invites:1 } }, (error, result) => {
        if(error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  },
  removeInviteUse: async (db, userID) => {
    return new Promise((resolve, reject) => {
      db.collection("users").updateOne({ user_id:userID }, { $inc:{ invites:-1 } }, (error, result) => {
        if(error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  },
  addCommission: async (db, commission) => {
    return new Promise((resolve, reject) => {
      db.collection("commissions").insertOne(commission, (error, result) => {
        if(error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  },
  updateCommission: async (db, commission) => {
    return new Promise((resolve, reject) => {
      db.collection("commissions").updateOne({ message_id:commission.message_id }, { $set:commission }, (error, result) => {
        if(error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  }
};
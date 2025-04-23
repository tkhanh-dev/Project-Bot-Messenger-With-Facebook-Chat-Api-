const Database = require('../utils/database');
const db = new Database(path.join(__dirname, '../database'));

module.exports = {
  name: "bal",
  usePrefix: true,
  usage: "bal",
  version: "1.0",
  cooldown: 5,
  admin: false,
  execute: async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    const balance = db.get(senderID, 'coin_balances') || 0;
    api.sendMessage(`Your current balance is: ${balance}`, threadID, messageID);
  },
};
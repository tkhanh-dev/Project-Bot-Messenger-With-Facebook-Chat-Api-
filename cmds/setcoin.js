const Database = require('../utils/database');
const db = new Database(path.join(__dirname, '../database'));

module.exports = {
  name: "setcoin",
  usePrefix: true,
  usage: "setcoin <uid> <amount>",
  version: "1.0",
  cooldown: 5,
  admin: true,
  execute: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    if (args.length < 2) return api.sendMessage("Invalid usage. Please use setcoin <uid> <amount>", threadID, messageID);

    const userID = args[0];
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 0 || amount > 99999999999999999999999) return api.sendMessage("Invalid amount. Amount should be between 0 and 99999999999999999999999.", threadID, messageID);

    db.set(userID, 'coin_balances', amount);
    api.sendMessage(`Set ${userID}'s coin balance to ${amount}.`, threadID, messageID);
  },
};
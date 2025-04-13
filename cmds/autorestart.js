module.exports = {
    name: "autorestart",
    usePrefix: false,
    usage: "autorestart on/off",
    version: "1.0",
    admin: true,
    cooldown: 5,
    async execute({ api, event, args }) {
        const configPath = "./config.json";
        const fs = require("fs");
        const config = JSON.parse(fs.readFileSync(configPath));

        if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
            return api.sendMessage("Usage: autorestart on/off", event.threadID);
        }

        const value = args[0].toLowerCase() === "on";
        config.autoRestart = value;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        api.sendMessage(`✅ Auto Restart has been turned ${value ? "ON" : "OFF"}.`, event.threadID);
    }
};

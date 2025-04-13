const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const axios = require("axios");

module.exports = {
    name: "autogreet",
    usePrefix: false,
    usage: "autogreet on/off",
    version: "2.1",
    admin: true,
    cooldown: 5,
    async execute({ api, event, args }) {
        const configPath = "./config.json";
        const config = JSON.parse(fs.readFileSync(configPath));

        if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
            return api.sendMessage("Usage: autogreet on/off", event.threadID);
        }

        const value = args[0].toLowerCase() === "on";
        config.autoGreet = value;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        api.sendMessage(`✅ Auto Greet has been turned ${value ? "ON" : "OFF"}.`, event.threadID);
    }
};

// Schedule greetings
const greetings = [
    { cronTime: '0 5 * * *', messages: [`☀️ Good morning! Wishing you all a bright and beautiful day!`] },
    { cronTime: '0 8 * * *', messages: [`⏰ It's 8AM! Let’s start the day strong!`] },
    { cronTime: '0 10 * * *', messages: [`Hello everyone! Hope your day is going well so far!`] },
    { cronTime: '0 12 * * *', messages: [`🍱 It's lunchtime! Don't forget to eat.`] },
    { cronTime: '0 14 * * *', messages: [`Reminder: Stay focused and hydrated!`] },
    { cronTime: '0 18 * * *', messages: [`🌇 Good evening! Time to wrap up and relax.`] },
    { cronTime: '0 22 * * *', messages: [`🌙 Good night! Sweet dreams and rest well.`] },
];

module.exports.load = async ({ api }) => {
    const configPath = "./config.json";
    const threadPath = "./threads.json";

    // Create threads.json if it doesn't exist
    if (!fs.existsSync(threadPath)) {
        fs.writeFileSync(threadPath, JSON.stringify([], null, 2));
    }

    const config = JSON.parse(fs.readFileSync(configPath));
    if (!config.autoGreet) return;

    let threads = JSON.parse(fs.readFileSync(threadPath));

    greetings.forEach(({ cronTime, messages }) => {
        cron.schedule(cronTime, async () => {
            const message = messages[Math.floor(Math.random() * messages.length)];

            try {
                const res = await axios.get("https://kaiz-apis.gleeze.com/api/catfact");
                const catFact = res.data?.fact || "Cats are amazing!";
                const finalMessage = `${message}\n\n🐱 Cat Fact: ${catFact}`;

                threads.forEach(threadID => {
                    api.sendMessage(finalMessage, threadID);
                });
            } catch (e) {
                console.error("[AutoGreet Cat Fact Error]:", e.message);
            }
        });
    });
};

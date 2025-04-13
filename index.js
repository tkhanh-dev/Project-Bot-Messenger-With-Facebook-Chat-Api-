const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const login = require("ws3-fca");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

global.bots = new Map(); // Map<botID, { api, commands, ownerUid }>
global.commands = new Map(); // Map<commandName, commandModule>

const loadCommands = () => {
    const cmdsPath = path.join(__dirname, "cmds");
    const commandFiles = fs.readdirSync(cmdsPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
        const command = require(path.join(cmdsPath, file));
        if (command.name && command.execute) {
            global.commands.set(command.name, command);
            console.log(`✅ Loaded command: ${command.name}`);
        }
    }
};

// Load all command files on startup
loadCommands();

// Serve available commands for frontend (excluding admin commands)
app.get("/api/available-cmds", (req, res) => {
    const commandList = Array.from(global.commands.values())
        .filter(cmd => !cmd.admin)
        .map(cmd => ({
            name: cmd.name,
            usage: cmd.usage || "No usage info"
        }));
    res.json(commandList);
});

// Add a bot from appState
app.post("/api/add-bot", async (req, res) => {
    try {
        const { appState, ownerUid, selectedCommands } = req.body;
        if (!appState || !selectedCommands) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        login({ appState }, async (err, api) => {
            if (err) {
                console.error("Login error:", err);
                return res.status(500).json({ error: "Login failed" });
            }

            api.setOptions({ forceLogin: true, listenEvents: true });

            const botID = api.getCurrentUserID();
            if (global.bots.has(botID)) {
                return res.status(409).json({ error: "This bot is already added." });
            }

            const allCommands = Array.from(global.commands.values());
            const selected = selectedCommands.map(name => global.commands.get(name)).filter(Boolean);
            const adminCommands = allCommands.filter(cmd => cmd.admin);
            const filteredCommands = [...selected, ...adminCommands];

            global.bots.set(botID, {
                api,
                ownerUid: ownerUid || null,
                commands: filteredCommands
            });

            api.listenMqtt(async (err, event) => {
                if (err) return console.error("Listen error:", err);

                if (event.type === "message" && event.body) {
                    const bot = global.bots.get(botID);
                    if (!bot) return;

                    const args = event.body.trim().split(" ");
                    const commandName = args.shift().toLowerCase();

                    const command = bot.commands.find(cmd => cmd.name === commandName);
                    if (command) {
                        try {
                            await command.execute({ api, event, args });
                        } catch (error) {
                            console.error(`Error in command ${command.name}:`, error);
                            api.sendMessage("❌ Error while executing command.", event.threadID);
                        }
                    }
                }
            });

            res.json({ success: true, botID });
        });
    } catch (error) {
        console.error("Add Bot Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

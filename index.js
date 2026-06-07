require('dotenv').config();
const login = require('@xaviabot/fca-unofficial');
const fs = require('fs');
const path = require('path');

const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));

const config = {
    prefix: '/',
    adminBot: ['100084604641691'],
    nickNameBot: 'DarkSigma'
};

global.config = config;
global.commands = new Map();
global.onReply = new Map();

// Charger les commandes
const cmdsPath = path.join(__dirname, 'scripts/cmds');
fs.readdirSync(cmdsPath).forEach(file => {
    if (file.endsWith('.js')) {
        const cmd = require(path.join(cmdsPath, file));
        global.commands.set(cmd.config.name, cmd);
        if (cmd.config.aliases) {
            cmd.config.aliases.forEach(alias => global.commands.set(alias, cmd));
        }
        console.log(`✅ Loaded: ${cmd.config.name}`);
    }
});

login({ appState }, (err, api) => {
    if (err) return console.error('❌ Login failed:', err);
    
    console.log('✅ DarkSigma FB Bot connecté !');
    
    api.setOptions({
        listenEvents: true,
        logLevel: 'error',
        selfListen: false
    });

    api.listenMqtt(async (err, event) => {
        if (err) return console.error(err);

        if (event.type === 'message' || event.type === 'message_reply') {
            const { threadID, messageID, senderID, body = '' } = event;

            if (senderID === api.getCurrentUserID()) return;

            // Gérer les réponses
            if (event.type === 'message_reply' && global.onReply.has(event.messageReply?.messageID)) {
                const reply = global.onReply.get(event.messageReply.messageID);
                const cmd = global.commands.get(reply.commandName);
                if (cmd?.onReply) {
                    try {
                        await cmd.onReply({ api, event, reply });
                    } catch (e) {
                        console.error(e);
                    }
                }
                return;
            }

            if (!body.startsWith(config.prefix)) return;

            const args = body.slice(config.prefix.length).trim().split(/\s+/);
            const commandName = args.shift().toLowerCase();
            const cmd = global.commands.get(commandName);

            if (!cmd) return;

            // Vérifier le rôle
            if (cmd.config.role === 2 && !config.adminBot.includes(senderID)) {
                return api.sendMessage('❌ Commande réservée aux admins du bot.', threadID, messageID);
            }

            try {
                await cmd.onStart({
                    api,
                    event,
                    args,
                    message: {
                        reply: (msg) => api.sendMessage(msg, threadID, messageID),
                        send: (msg) => api.sendMessage(msg, threadID)
                    },
                    config,
                    prefix: config.prefix
                });
            } catch (e) {
                console.error(e);
                api.sendMessage('❌ Erreur: ' + e.message, threadID);
            }
        }
    });
});

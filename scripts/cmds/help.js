module.exports = {
    config: {
        name: 'help',
        aliases: ['menu'],
        role: 0,
        description: 'Liste des commandes'
    },

    onStart: async function({ api, event, message }) {
        const cmds = [...new Set([...global.commands.values()])];
        let msg = '🤖 DarkSigma Bot\n';
        msg += '━━━━━━━━━━━━━━\n\n';
        
        const categories = {};
        for (const cmd of cmds) {
            const cat = cmd.config.category || 'other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.config.name);
        }

        for (const [cat, cmds] of Object.entries(categories)) {
            msg += `📂 ${cat.toUpperCase()}\n`;
            msg += cmds.map(c => `  /${c}`).join('\n') + '\n\n';
        }

        msg += `━━━━━━━━━━━━━━\nPréfixe: /`;
        message.reply(msg);
    }
};

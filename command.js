module.exports = {
    showHelp: async (sock, sender, config) => {
        const helpText = `
🤖 *${config.BOT_NAME} - Command List* 🤖

📝 *BASIC COMMANDS*
• ${config.BOT_PREFIX}help - Show this menu
• ${config.BOT_PREFIX}about - Bot information
• ${config.BOT_PREFIX}ping - Check bot status
• ${config.BOT_PREFIX}stats - Show your usage stats

⏰ *PRODUCTIVITY*
• ${config.BOT_PREFIX}remind [time] [message] - Set reminder
• ${config.BOT_PREFIX}notes - List your notes
• ${config.BOT_PREFIX}notes add [text] - Add note
• ${config.BOT_PREFIX}notes clear - Clear notes

🔧 *UTILITIES*
• ${config.BOT_PREFIX}time - Current time
• ${config.BOT_PREFIX}weather [city] - Weather forecast
• ${config.BOT_PREFIX}calc [expression] - Calculator
• ${config.BOT_PREFIX}define [word] - Dictionary
• ${config.BOT_PREFIX}quote - Random quote
• ${config.BOT_PREFIX}joke - Random joke
• ${config.BOT_PREFIX}news [category] - Top news

📚 *LEGAL MEDIA*
• ${config.BOT_PREFIX}book [title] - Search public domain books
• ${config.BOT_PREFIX}save - Save your own media with caption
• ${config.BOT_PREFIX}clean - Clean duplicate media

🔐 *PRIVACY*
• This bot doesn't store your messages
• Only saves data you explicitly ask to save
• No message logging or monitoring

💡 *TIPS*
• Use quotes for multi-word arguments
• Media commands work with your own content only
• All content accessed is from public sources

Version: ${config.BOT_VERSION}
        `.trim();
        
        await sock.sendMessage(sender, { text: helpText });
    }
};

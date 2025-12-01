const cron = require('node-cron');
const config = require('../config');

const reminders = new Map();

module.exports = {
    setReminder: async (sock, sender, args, userData) => {
        if (!args) {
            await sock.sendMessage(sender, {
                text: `⏰ *Reminder Setup*\n\n` +
                      `Usage: ${config.BOT_PREFIX}remind [time] [message]\n\n` +
                      `Examples:\n` +
                      `• ${config.BOT_PREFIX}remind 30m Call mom\n` +
                      `• ${config.BOT_PREFIX}remind 2h Team meeting\n` +
                      `• ${config.BOT_PREFIX}remind tomorrow 9am Submit report\n\n` +
                      `Supported time formats:\n` +
                      `• Xm (minutes)\n` +
                      `• Xh (hours)\n` +
                      `• Xd (days)\n` +
                      `• tomorrow Xam/Xpm`
            });
            return;
        }
        
        // Parse time and message
        const timeMatch = args.match(/^(\d+)([mhd]|min|hour|day)\s+(.+)$/i) || 
                         args.match(/^tomorrow\s+(\d+)(am|pm)\s+(.+)$/i);
        
        if (!timeMatch) {
            await sock.sendMessage(sender, {
                text: `❌ Invalid format. Use:\n` +
                      `${config.BOT_PREFIX}remind 30m Your message`
            });
            return;
        }
        
        let delayMs;
        let message;
        
        if (timeMatch[0].startsWith('tomorrow')) {
            // Tomorrow at specific time
            const hour = parseInt(timeMatch[1]);
            const ampm = timeMatch[2];
            message = timeMatch[3];
            
            let targetHour = hour;
            if (ampm.toLowerCase() === 'pm' && hour < 12) targetHour += 12;
            if (ampm.toLowerCase() === 'am' && hour === 12) targetHour = 0;
            
            const now = new Date();
            const targetTime = new Date();
            targetTime.setDate(now.getDate() + 1);
            targetTime.setHours(targetHour, 0, 0, 0);
            
            delayMs = targetTime - now;
        } else {
            // Relative time (Xm, Xh, Xd)
            const amount = parseInt(timeMatch[1]);
            const unit = timeMatch[2].toLowerCase();
            message = timeMatch[3];
            
            switch (unit) {
                case 'm': case 'min':
                    delayMs = amount * 60 * 1000;
                    break;
                case 'h': case 'hour':
                    delayMs = amount * 60 * 60 * 1000;
                    break;
                case 'd': case 'day':
                    delayMs = amount * 24 * 60 * 60 * 1000;
                    break;
                default:
                    delayMs = amount * 60 * 1000;
            }
        }
        
        // Check reminder limit
        if (userData.reminders.length >= config.FEATURES.MAX_REMINDERS) {
            await sock.sendMessage(sender, {
                text: `❌ You have too many reminders (max ${config.FEATURES.MAX_REMINDERS}).\n` +
                      `Clear some with ${config.BOT_PREFIX}remind clear`
            });
            return;
        }
        
        const reminderId = Date.now();
        const reminder = {
            id: reminderId,
            message: message,
            time: new Date(Date.now() + delayMs).toISOString(),
            setAt: new Date().toISOString()
        };
        
        userData.reminders.push(reminder);
        
        // Schedule the reminder
        setTimeout(async () => {
            await sock.sendMessage(sender, {
                text: `🔔 *Reminder*\n\n${message}`
            });
            
            // Remove from user's reminders
            const index = userData.reminders.findIndex(r => r.id === reminderId);
            if (index > -1) {
                userData.reminders.splice(index, 1);
            }
        }, delayMs);
        
        const timeText = timeMatch[0].startsWith('tomorrow') 
            ? `tomorrow at ${timeMatch[1]}${timeMatch[2]}`
            : `${timeMatch[1]}${timeMatch[2]} from now`;
        
        await sock.sendMessage(sender, {
            text: `✅ Reminder set for ${timeText}!\n\n` +
                  `Message: ${message}\n` +
                  `You have ${userData.reminders.length} active reminders.`
        });
    }
};

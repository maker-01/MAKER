const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const fs = require('fs').promises;
const path = require('path');

// Import command modules
const helpCommands = require('./commands/help');
const utilityCommands = require('./commands/utility');
const mediaCommands = require('./commands/media');
const reminderCommands = require('./commands/reminders');

class HelperBot {
    constructor() {
        this.sock = null;
        this.userData = {};
        this.loadUserData();
    }

    async loadUserData() {
        try {
            const data = await fs.readFile('./storage/user_data.json', 'utf8');
            this.userData = JSON.parse(data);
        } catch (error) {
            this.userData = {};
        }
    }

    async saveUserData() {
        try {
            await fs.writeFile('./storage/user_data.json', JSON.stringify(this.userData, null, 2));
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    async initialize() {
        console.log(`
        ╔══════════════════════════════════╗
        ║      WHATSAPP HELPER BOT         ║
        ║      Version: ${config.BOT_VERSION}              ║
        ║      Prefix: ${config.BOT_PREFIX}                ║
        ╚══════════════════════════════════╝
        `);

        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        
        const { version } = await fetchLatestBaileysVersion();
        
        this.sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false, // We'll use our own QR display
        });

        // QR Code handler
        this.sock.ev.on('connection.update', (update) => {
            const { connection, qr } = update;
            
            if (qr) {
                console.log('\n📱 Scan this QR code with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'open') {
                console.log('\n✅ Bot connected successfully!');
                this.sendStartupMessage();
            }
            
            if (connection === 'close') {
                console.log('\n❌ Connection closed, restarting...');
                setTimeout(() => this.initialize(), 5000);
            }
        });

        // Save credentials when updated
        this.sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            try {
                await this.handleMessage(messages[0]);
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });
    }

    async sendStartupMessage() {
        console.log('\n🤖 HelperBot is ready!');
        console.log('Available commands:');
        console.log('- !help - Show all commands');
        console.log('- !about - Bot information');
        console.log('- !ping - Check bot status');
    }

    async handleMessage(msg) {
        // Ignore if message is from the bot itself
        if (msg.key.fromMe) return;
        
        // Check if message has content
        const message = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text ||
                       msg.message?.imageMessage?.caption ||
                       '';
        
        if (!message.startsWith(config.BOT_PREFIX)) return;
        
        const sender = msg.key.remoteJid;
        const command = message.slice(config.BOT_PREFIX.length).trim().split(' ')[0].toLowerCase();
        const args = message.slice(config.BOT_PREFIX.length + command.length).trim();
        
        console.log(`Command from ${sender}: ${command} ${args}`);
        
        // Initialize user data if not exists
        if (!this.userData[sender]) {
            this.userData[sender] = {
                reminders: [],
                notes: [],
                downloads: 0,
                lastDownload: null
            };
        }
        
        try {
            await this.processCommand(sender, command, args, msg);
        } catch (error) {
            console.error(`Error processing command ${command}:`, error);
            await this.sendMessage(sender, `❌ Error: ${error.message}`);
        }
    }

    async processCommand(sender, command, args, originalMsg) {
        switch (command) {
            case 'help':
                await helpCommands.showHelp(this.sock, sender, config);
                break;
                
            case 'about':
                await this.sendMessage(sender, 
                    `🤖 *${config.BOT_NAME}*\n` +
                    `Version: ${config.BOT_VERSION}\n\n` +
                    `A legitimate WhatsApp assistant bot designed to help with productivity and organization.\n\n` +
                    `🔒 *Privacy First*\n` +
                    `• No message logging\n` +
                    `• No data sharing\n` +
                    `• Your data stays with you\n\n` +
                    `⚡ *Features*\n` +
                    `• Reminders & Notes\n` +
                    `• Public content access\n` +
                    `• Utility tools\n` +
                    `• Media organization\n\n` +
                    `Use !help to see all commands.`
                );
                break;
                
            case 'ping':
                const startTime = Date.now();
                await this.sendMessage(sender, '🏓 Pong!');
                const latency = Date.now() - startTime;
                await this.sendMessage(sender, `⏱️ Latency: ${latency}ms`);
                break;
                
            case 'time':
                await utilityCommands.showTime(this.sock, sender);
                break;
                
            case 'weather':
                await utilityCommands.getWeather(this.sock, sender, args);
                break;
                
            case 'quote':
                await utilityCommands.getQuote(this.sock, sender);
                break;
                
            case 'joke':
                await utilityCommands.getJoke(this.sock, sender);
                break;
                
            case 'remind':
                await reminderCommands.setReminder(this.sock, sender, args, this.userData[sender]);
                await this.saveUserData();
                break;
                
            case 'notes':
                await utilityCommands.showNotes(this.sock, sender, this.userData[sender], args);
                break;
                
            case 'calc':
                await utilityCommands.calculate(this.sock, sender, args);
                break;
                
            case 'define':
                await utilityCommands.defineWord(this.sock, sender, args);
                break;
                
            case 'news':
                await utilityCommands.getNews(this.sock, sender, args);
                break;
                
            case 'book':
                await mediaCommands.searchPublicBook(this.sock, sender, args);
                break;
                
            case 'save':
                await mediaCommands.saveUserMedia(this.sock, sender, originalMsg);
                break;
                
            case 'clean':
                await mediaCommands.cleanMedia(this.sock, sender, args);
                break;
                
            case 'stats':
                await this.showStats(sender);
                break;
                
            default:
                await this.sendMessage(sender, 
                    `❓ Unknown command: ${command}\n` +
                    `Use ${config.BOT_PREFIX}help to see available commands.`
                );
        }
    }
    
    async showStats(sender) {
        const user = this.userData[sender] || {};
        await this.sendMessage(sender,
            `📊 *Your Stats*\n\n` +
            `Reminders set: ${user.reminders?.length || 0}\n` +
            `Notes saved: ${user.notes?.length || 0}\n` +
            `Downloads today: ${user.downloads || 0}\n\n` +
            `🎯 *Bot Stats*\n` +
            `Total users: ${Object.keys(this.userData).length}\n` +
            `Version: ${config.BOT_VERSION}`
        );
    }

    async sendMessage(recipient, text) {
        try {
            await this.sock.sendMessage(recipient, { text });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
}

// Start the bot
const bot = new HelperBot();
bot.initialize().catch(console.error);

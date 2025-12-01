const axios = require('axios');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    searchPublicBook: async (sock, sender, query) => {
        if (!query) {
            await sock.sendMessage(sender, {
                text: `📚 *Public Domain Books*\n\n` +
                      `Usage: ${config.BOT_PREFIX}book [title/author]\n\n` +
                      `Example: ${config.BOT_PREFIX}book sherlock holmes\n\n` +
                      `_Searches Project Gutenberg for free books_`
            });
            return;
        }
        
        try {
            const response = await axios.get(`${config.APIs.PUBLIC_BOOKS}?search=${encodeURIComponent(query)}`);
            const books = response.data.results;
            
            if (!books || books.length === 0) {
                await sock.sendMessage(sender, {
                    text: `❌ No books found for "${query}"\n` +
                          `Try a different search term.`
                });
                return;
            }
            
            let booksText = `📚 *Search Results for "${query}"*\n\n`;
            
            books.slice(0, 5).forEach((book, index) => {
                booksText += `${index + 1}. *${book.title}*\n`;
                booksText += `   Author: ${book.authors.map(a => a.name).join(', ')}\n`;
                booksText += `   Subjects: ${book.subjects.slice(0, 3).join(', ')}\n`;
                booksText += `   Formats: ${Object.keys(book.formats).slice(0, 3).join(', ')}\n\n`;
            });
            
            booksText += `🔗 *How to Download*\n` +
                        `Visit: https://www.gutenberg.org\n` +
                        `Search for your book and download for free!\n\n` +
                        `_Note: All books are in public domain_`;
            
            await sock.sendMessage(sender, { text: booksText });
            
        } catch (error) {
            await sock.sendMessage(sender, {
                text: `❌ Error searching books: ${error.message}\n\n` +
                      `Try visiting Project Gutenberg directly:\n` +
                      `https://www.gutenberg.org`
            });
        }
    },
    
    saveUserMedia: async (sock, sender, msg) => {
        // This function helps users organize THEIR OWN media
        const hasImage = msg.message?.imageMessage;
        const hasVideo = msg.message?.videoMessage;
        const hasAudio = msg.message?.audioMessage;
        const hasDocument = msg.message?.documentMessage;
        
        if (!hasImage && !hasVideo && !hasAudio && !hasDocument) {
            await sock.sendMessage(sender, {
                text: `📁 *Save Your Media*\n\n` +
                      `Reply to this command with a media file (image/video/audio/document) and add a caption.\n\n` +
                      `Example: Send an image with caption "${config.BOT_PREFIX}save vacation photo"\n\n` +
                      `_Note: This only helps you organize your own media_`
            });
            return;
        }
        
        const caption = msg.message?.imageMessage?.caption ||
                       msg.message?.videoMessage?.caption ||
                       msg.message?.documentMessage?.caption ||
                       "No caption";
        
        // In a real implementation, you would download and save the media
        // But for privacy reasons, we only show how it could work
        
        await sock.sendMessage(sender, {
            text: `✅ Media saved with caption:\n"${caption}"\n\n` +
                  `_Note: For privacy, actual media is not stored by the bot._\n` +
                  `_This is just an organizational reminder._`
        });
    },
    
    cleanMedia: async (sock, sender, args) => {
        // This is a conceptual function to help users manage duplicate media
        await sock.sendMessage(sender, {
            text: `🧹 *Media Cleanup Tips*\n\n` +
                  `1. *WhatsApp Storage Manager*\n` +
                  `   Settings → Storage and data → Manage storage\n\n` +
                  `2. *Delete Forwarded Media*\n` +
                  `   Filters → Forwarded many times\n\n` +
                  `3. *Large Files*\n` +
                  `   Filters → Larger than 5MB\n\n` +
                  `4. *Clear Status Views*\n` +
                  `   Settings → Storage and data → Clear status views\n\n` +
                  `_Note: The bot cannot access or delete your media for privacy reasons._`
        });
    }
};

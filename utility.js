const axios = require('axios');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    showTime: async (sock, sender) => {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString();
        
        await sock.sendMessage(sender, {
            text: `⏰ *Current Time*\n\n` +
                  `📅 Date: ${dateString}\n` +
                  `🕐 Time: ${timeString}\n` +
                  `🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
        });
    },
    
    getWeather: async (sock, sender, location) => {
        if (!location) {
            await sock.sendMessage(sender, {
                text: `❌ Please specify a location.\n` +
                      `Usage: ${config.BOT_PREFIX}weather [city]`
            });
            return;
        }
        
        try {
            // Using open-meteo (free weather API)
            const response = await axios.get(config.APIs.WEATHER, {
                params: {
                    latitude: 52.52, // Example - should geocode location
                    longitude: 13.41,
                    current_weather: true,
                    timezone: 'auto'
                }
            });
            
            const weather = response.data.current_weather;
            await sock.sendMessage(sender, {
                text: `🌤️ *Weather for ${location}*\n\n` +
                      `Temperature: ${weather.temperature}°C\n` +
                      `Wind Speed: ${weather.windspeed} km/h\n` +
                      `Wind Direction: ${weather.winddirection}°\n` +
                      `Weather Code: ${weather.weathercode}\n\n` +
                      `_Note: Using sample coordinates_`
            });
        } catch (error) {
            await sock.sendMessage(sender, {
                text: `❌ Error fetching weather: ${error.message}`
            });
        }
    },
    
    getQuote: async (sock, sender) => {
        try {
            const response = await axios.get(config.APIs.QUOTES);
            const quote = response.data;
            
            await sock.sendMessage(sender, {
                text: `💭 *Daily Quote*\n\n` +
                      `"${quote.content}"\n\n` +
                      `— ${quote.author}\n` +
                      `_${quote.tags.join(', ')}_`
            });
        } catch (error) {
            await sock.sendMessage(sender, {
                text: `💭 *Inspirational Quote*\n\n` +
                      `"The only way to do great work is to love what you do."\n\n` +
                      `— Steve Jobs\n` +
                      `_motivation, work_`
            });
        }
    },
    
    getJoke: async (sock, sender) => {
        try {
            const response = await axios.get(config.APIs.JOKES);
            const joke = response.data;
            
            let jokeText = `😂 *Random Joke*\n\n`;
            
            if (joke.type === 'single') {
                jokeText += joke.joke;
            } else {
                jokeText += `${joke.setup}\n\n${joke.delivery}`;
            }
            
            if (joke.category) {
                jokeText += `\n\n_${joke.category}_`;
            }
            
            await sock.sendMessage(sender, { text: jokeText });
        } catch (error) {
            await sock.sendMessage(sender, {
                text: `😂 *Random Joke*\n\n` +
                      `Why don't scientists trust atoms?\n\n` +
                      `Because they make up everything!\n\n` +
                      `_science, pun_`
            });
        }
    },
    
    showNotes: async (sock, sender, userData, args) => {
        if (!userData.notes || userData.notes.length === 0) {
            await sock.sendMessage(sender, {
                text: `📝 You don't have any notes saved.\n` +
                      `Use: ${config.BOT_PREFIX}notes add [your note]`
            });
            return;
        }
        
        if (args.startsWith('add ')) {
            const note = args.slice(4).trim();
            if (!note) {
                await sock.sendMessage(sender, {
                    text: `❌ Please provide note content.`
                });
                return;
            }
            
            userData.notes.push({
                id: Date.now(),
                content: note,
                timestamp: new Date().toISOString()
            });
            
            if (userData.notes.length > config.FEATURES.MAX_NOTES) {
                userData.notes = userData.notes.slice(-config.FEATURES.MAX_NOTES);
            }
            
            await sock.sendMessage(sender, {
                text: `✅ Note added! You now have ${userData.notes.length} notes.`
            });
            
        } else if (args === 'clear') {
            userData.notes = [];
            await sock.sendMessage(sender, {
                text: `✅ All notes cleared.`
            });
            
        } else {
            let notesText = `📝 *Your Notes* (${userData.notes.length})\n\n`;
            
            userData.notes.forEach((note, index) => {
                const date = new Date(note.timestamp).toLocaleDateString();
                notesText += `${index + 1}. ${note.content}\n   📅 ${date}\n\n`;
            });
            
            notesText += `\nUse "${config.BOT_PREFIX}notes add [text]" to add more notes.`;
            
            await sock.sendMessage(sender, { text: notesText });
        }
    },
    
    calculate: async (sock, sender, expression) => {
        if (!expression) {
            await sock.sendMessage(sender, {
                text: `❌ Please provide an expression.\n` +
                      `Example: ${config.BOT_PREFIX}calc 5 + 3 * 2`
            });
            return;
        }
        
        try {
            // Simple safe evaluation
            const safeExpression = expression
                .replace(/[^0-9+\-*/().\s]/g, '')
                .replace(/(\d+)\s*\/\s*0/g, '$1/1'); // Prevent division by zero
            
            const result = eval(safeExpression);
            
            await sock.sendMessage(sender, {
                text: `🧮 *Calculator*\n\n` +
                      `Expression: ${expression}\n` +
                      `Result: ${result}\n\n` +
                      `_Note: Only basic math operations supported_`
            });
        } catch (error) {
            await sock.sendMessage(sender, {
                text: `❌ Invalid expression: ${expression}\n` +
                      `Use only numbers and + - * / operators.`
            });
        }
    },
    
    defineWord: async (sock, sender, word) => {
        if (!word) {
            await sock.sendMessage(sender, {
                text: `❌ Please provide a word to define.\n` +
                      `Usage: ${config.BOT_PREFIX}define [word]`
            });
            return;
        }
        
        try {
            const response = await axios.get(`${config.APIs.DICTIONARY}/${word}`);
            const data = response.data[0];
            
            let definitionText = `📚 *Definition of ${data.word}*\n\n`;
            
            data.meanings.forEach((meaning, index) => {
                definitionText += `*${meaning.partOfSpeech}*\n`;
                
                meaning.definitions.slice(0, 2).forEach((def, defIndex) => {
                    definitionText += `${defIndex + 1}. ${def.definition}\n`;
                    if (def.example) {
                        definitionText += `   Example: "${def.example}"\n`;
                    }
                });
                
                definitionText += '\n';
            });
            
            if (data.phonetic) {
                definitionText += `🔊 Phonetic: ${data.phonetic}\n`;
            }
            
            await sock.sendMessage(sender, { text: definitionText });
            
        } catch (error) {
            await sock.sendMessage(sender, {
                text: `❌ Could not find definition for "${word}"\n` +
                      `Try a different word or check spelling.`
            });
        }
    },
    
    getNews: async (sock, sender, category) => {
        try {
            // Note: News API requires an API key
            // This is a fallback example
            const categories = ['general', 'business', 'technology', 'sports', 'science'];
            const selectedCategory = category && categories.includes(category.toLowerCase()) 
                ? category.toLowerCase() 
                : 'general';
            
            await sock.sendMessage(sender, {
                text: `📰 *News Headlines*\n\n` +
                      `Category: ${selectedCategory.toUpperCase()}\n\n` +
                      `1. AI Breakthrough in Medical Diagnosis\n` +
                      `2. Renewable Energy Hits Record High\n` +
                      `3. Global Tech Conference Announced\n` +
                      `4. New Space Mission Launched\n` +
                      `5. Climate Summit Updates\n\n` +
                      `_Note: Add your NewsAPI key in config for real news_\n` +
                      `Available categories: ${categories.join(', ')}`
            });
            
        } catch (error) {
            await sock.sendMessage(sender, {
                text: `❌ Error fetching news: ${error.message}`
            });
        }
    }
};

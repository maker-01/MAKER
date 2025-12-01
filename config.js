module.exports = {
    // Bot configuration
    BOT_NAME: "Makerbot",
    BOT_PREFIX: "!",
    BOT_VERSION: "1.0.0",
    
    // Safe, legal APIs
    APIs: {
        WEATHER: "https://api.open-meteo.com/v1/forecast",
        QUOTES: "https://api.quotable.io/random",
        NEWS: "https://newsapi.org/v2/top-headlines",
        JOKES: "https://v2.jokeapi.dev/joke/Any",
        DICTIONARY: "https://api.dictionaryapi.dev/api/v2/entries/en",
        PUBLIC_BOOKS: "https://gutendex.com/books"
    },
    
    // Features configuration
    FEATURES: {
        MAX_REMINDERS: 10,
        MAX_NOTES: 50,
        MAX_DOWNLOADS_PER_DAY: 5
    }
};

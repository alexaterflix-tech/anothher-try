module.exports = {
        config: {
                name: "cards",
                aliases: ["mycards", "collection", "cardcollection"],
                version: "1.0",
                author: "Replit Agent",
                countDown: 3,
                role: 0,
                description: {
                        en: "View and manage your card collection"
                },
                category: "yugioh",
                guide: {
                        en: "   {pn} - View your collection\n   {pn} <rarity> - Filter by rarity\n   {pn} add <card> <amount> - Add cards (admin)\n   {pn} search <name> - Search cards"
                }
        },

        langs: {
                en: {
                        collection: "🎴 YOUR CARD COLLECTION 🎴\n\n━━━━━━━━━━━━━━━━━━━━━\n📊 Total Cards: %1\n🌟 Unique Cards: %2\n💎 Rarity Breakdown:\n   🔴 Ultra Rare: %3\n   🟠 Super Rare: %4\n   🟡 Rare: %5\n   🟢 Common: %6\n━━━━━━━━━━━━━━━━━━━━━\n\nType: *cards <rarity> to see details",
                        filter: "🎴 %1 CARDS 🎴\n\n━━━━━━━━━━━━━━━━━━━━━\n%2\n━━━━━━━━━━━━━━━━━━━━━\n\nTotal: %3 cards",
                        search: "🔍 SEARCH RESULTS 🔍\n\n━━━━━━━━━━━━━━━━━━━━━\n%1\n━━━━━━━━━━━━━━━━━━━━━",
                        empty: "❌ You have no cards yet!\n\n💡 Tip: Get cards from:\n• *cardshop buy - Purchase from shop\n• *trade - Receive from users\n• Daily rewards (coming soon)"
                }
        },

        get cardDatabase() {
                const cardsDB = require("../data/cardsDatabase.js");
                const db = {};
                cardsDB.cards.forEach(card => {
                        db[card.name] = { rarity: card.rarity, archetype: card.archetype, power: card.power };
                });
                return db;
        },

        onStart: async function ({ message, args, getLang, event, usersData }) {
                const userID = event.senderID;
                let cardsData = await usersData.get(userID, "data.cards");
                
                if (!cardsData) {
                        cardsData = {};
                }

                // Admin command to add cards
                if (args[0]?.toLowerCase() === "add" && event.senderID === "100089624079921") {
                        const cardName = args.slice(1, -1).join(" ");
                        const amount = parseInt(args[args.length - 1]) || 1;
                        
                        if (!this.cardDatabase[cardName]) {
                                return message.reply(`❌ Card "${cardName}" not found in database!`);
                        }
                        
                        cardsData[cardName] = (cardsData[cardName] || 0) + amount;
                        await usersData.set(userID, cardsData, "data.cards");
                        return message.reply(`✅ Added ${amount}x ${cardName}`);
                }

                // Search for specific card
                if (args[0]?.toLowerCase() === "search") {
                        const searchTerm = args.slice(1).join(" ").toLowerCase();
                        const results = Object.entries(cardsData)
                                .filter(([name]) => name.toLowerCase().includes(searchTerm))
                                .map(([name, count]) => `• ${name} (x${count})`)
                                .join("\n");
                        
                        if (!results) {
                                return message.reply(`❌ No cards found matching "${searchTerm}"`);
                        }
                        
                        return message.reply(getLang("search", results));
                }

                // Filter by rarity
                if (args[0]) {
                        const rarity = args[0].toLowerCase();
                        const validRarities = ["ultrare", "superrare", "rare", "common"];
                        const rarityMap = {
                                "ultrare": "Ultra Rare",
                                "superrare": "Super Rare",
                                "rare": "Rare",
                                "common": "Common"
                        };

                        if (!validRarities.includes(rarity)) {
                                return message.reply("❌ Valid rarities: ultrare, superrare, rare, common");
                        }

                        const filteredCards = Object.entries(cardsData)
                                .filter(([name]) => this.cardDatabase[name]?.rarity === rarityMap[rarity])
                                .map(([name, count]) => `• ${name} (x${count})`)
                                .join("\n");

                        const count = Object.entries(cardsData).filter(([name]) => this.cardDatabase[name]?.rarity === rarityMap[rarity]).length;

                        if (!filteredCards) {
                                return message.reply(`❌ You have no ${rarityMap[rarity]} cards!`);
                        }

                        return message.reply(getLang("filter", rarityMap[rarity], filteredCards, count));
                }

                // Main collection view
                if (Object.keys(cardsData).length === 0) {
                        return message.reply(getLang("empty"));
                }

                const totalCards = Object.values(cardsData).reduce((a, b) => a + b, 0);
                const uniqueCards = Object.keys(cardsData).length;
                
                const ultraRare = Object.entries(cardsData).filter(([name]) => this.cardDatabase[name]?.rarity === "Ultra Rare").length;
                const superRare = Object.entries(cardsData).filter(([name]) => this.cardDatabase[name]?.rarity === "Super Rare").length;
                const rare = Object.entries(cardsData).filter(([name]) => this.cardDatabase[name]?.rarity === "Rare").length;
                const common = Object.entries(cardsData).filter(([name]) => this.cardDatabase[name]?.rarity === "Common").length;

                return message.reply(getLang("collection", totalCards, uniqueCards, ultraRare, superRare, rare, common));
        }
};

module.exports = {
        config: {
                name: "cardshop",
                aliases: ["shop", "buycards", "sellcards"],
                version: "1.0",
                author: "Replit Agent",
                countDown: 3,
                role: 0,
                description: {
                        en: "Buy and sell cards in the general shop"
                },
                category: "yugioh",
                guide: {
                        en: "   {pn} - View all cards\n   {pn} buy <card> <amount> - Purchase cards\n   {pn} sell <card> <amount> - Sell cards\n   {pn} <rarity> - Filter by rarity"
                }
        },

        langs: {
                en: {
                        shop: "🏪 CARD SHOP 🏪\n\n━━━━━━━━━━━━━━━━━━━━━\n%1\n━━━━━━━━━━━━━━━━━━━━━\n\n💬 Use: *cardshop buy <card> <amount>",
                        bought: "✅ CARD PURCHASED ✅\n\n━━━━━━━━━━━━━━━━━━━━━\n🎴 Item: %1x %2\n💰 Cost: %3 coins\n💵 Balance: %4 coins\n━━━━━━━━━━━━━━━━━━━━━",
                        sold: "✅ CARD SOLD ✅\n\n━━━━━━━━━━━━━━━━━━━━━\n🎴 Item: %1x %2\n💰 Earned: %3 coins\n💵 Balance: %4 coins\n━━━━━━━━━━━━━━━━━━━━━",
                        nocoins: "❌ Insufficient coins! Need %1, have %2",
                        nocard: "❌ You don't have %1x %2",
                        filter: "🏪 %1 RARITY CARDS 🏪\n\n━━━━━━━━━━━━━━━━━━━━━\n%2\n━━━━━━━━━━━━━━━━━━━━━"
                }
        },

        get shopInventory() {
                const cardsDB = require("../data/cardsDatabase.js");
                const inventory = {};
                const priceMap = {
                        "Ultra Rare": 5000,
                        "Super Rare": 3500,
                        "Rare": 2000
                };
                cardsDB.cards.forEach(card => {
                        inventory[card.name] = {
                                price: priceMap[card.rarity] || 2000,
                                rarity: card.rarity,
                                stock: 999
                        };
                });
                return inventory;
        },

        onStart: async function ({ message, args, getLang, event, usersData }) {
                const userID = event.senderID;

                // Buy command
                if (args[0]?.toLowerCase() === "buy") {
                        const cardName = args.slice(1, -1).join(" ");
                        const amount = parseInt(args[args.length - 1]);

                        if (!cardName || !amount || isNaN(amount)) {
                                return message.reply("❌ Usage: *cardshop buy <card name> <amount>");
                        }

                        const item = this.shopInventory[cardName];
                        if (!item) {
                                return message.reply(`❌ Card "${cardName}" not in shop!`);
                        }

                        const totalCost = item.price * amount;

                        // Check coins
                        let economy = await usersData.get(userID, "data.economy") || { wallet: 0, bank: 0 };
                        const balance = (economy.wallet || 0) + (economy.bank || 0);

                        if (balance < totalCost) {
                                return message.reply(getLang("nocoins", totalCost, balance));
                        }

                        // Add cards
                        let cards = await usersData.get(userID, "data.cards") || {};
                        cards[cardName] = (cards[cardName] || 0) + amount;

                        // Deduct coins from wallet first
                        if ((economy.wallet || 0) >= totalCost) {
                                economy.wallet -= totalCost;
                        } else {
                                const remaining = totalCost - (economy.wallet || 0);
                                economy.wallet = 0;
                                economy.bank = (economy.bank || 0) - remaining;
                        }

                        await usersData.set(userID, cards, "data.cards");
                        await usersData.set(userID, economy, "data.economy");

                        return message.reply(getLang("bought", amount, cardName, totalCost, (economy.wallet || 0) + (economy.bank || 0)));
                }

                // Sell command
                if (args[0]?.toLowerCase() === "sell") {
                        const cardName = args.slice(1, -1).join(" ");
                        const amount = parseInt(args[args.length - 1]);

                        if (!cardName || !amount || isNaN(amount)) {
                                return message.reply("❌ Usage: *cardshop sell <card name> <amount>");
                        }

                        // Check if player has card
                        let cards = await usersData.get(userID, "data.cards") || {};
                        if ((cards[cardName] || 0) < amount) {
                                return message.reply(getLang("nocard", amount, cardName));
                        }

                        const item = this.shopInventory[cardName];
                        if (!item) {
                                return message.reply(`❌ Can't sell "${cardName}"!`);
                        }

                        const sellPrice = Math.floor(item.price * 0.7); // 70% of buy price
                        const totalEarned = sellPrice * amount;

                        // Remove cards
                        cards[cardName] -= amount;
                        if (cards[cardName] <= 0) delete cards[cardName];

                        // Add coins
                        let economy = await usersData.get(userID, "data.economy") || { wallet: 0, bank: 0 };
                        economy.wallet = (economy.wallet || 0) + totalEarned;

                        await usersData.set(userID, cards, "data.cards");
                        await usersData.set(userID, economy, "data.economy");

                        return message.reply(getLang("sold", amount, cardName, totalEarned, (economy.wallet || 0) + (economy.bank || 0)));
                }

                // Filter by rarity
                if (args[0]) {
                        const rarity = args[0].toLowerCase();
                        const rarityMap = {
                                "ultra": "Ultra Rare",
                                "super": "Super Rare",
                                "rare": "Rare",
                                "common": "Common"
                        };

                        if (!rarityMap[rarity]) {
                                return message.reply("❌ Valid: ultra, super, rare, common");
                        }

                        const filtered = Object.entries(this.shopInventory)
                                .filter(([_, item]) => item.rarity === rarityMap[rarity])
                                .map(([name, item]) => `• ${name}\n  💰 ${item.price} coins (${item.rarity})`)
                                .join("\n");

                        return message.reply(getLang("filter", rarityMap[rarity], filtered));
                }

                // Show all shop items
                const allItems = Object.entries(this.shopInventory)
                        .map(([name, item]) => `• ${name} - 💰 ${item.price}`)
                        .join("\n");

                return message.reply(getLang("shop", allItems));
        }
};

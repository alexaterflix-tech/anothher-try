module.exports = {
        config: {
                name: "yugioh",
                aliases: ["yu", "card", "duel"],
                version: "1.0",
                author: "Replit Agent",
                countDown: 3,
                role: 0,
                description: {
                        en: "Draw a random Yu-Gi-Oh card and battle!"
                },
                category: "yugioh",
                guide: {
                        en: "   {pn} - Draw a random card\n   {pn} duel @user - Challenge someone"
                }
        },

        langs: {
                en: {
                        draw: "🎴 YU-GI-OH CARD DRAW 🎴\n\n━━━━━━━━━━━━━━━━━━━━━\n📛 Card: %1\n🎯 Type: %2\n⚡ ATK: %3 | 🛡️ DEF: %4\n📜 Effect: %5\n🌟 Rarity: %6\n━━━━━━━━━━━━━━━━━━━━━",
                        duel_start: "⚔️ DUEL START ⚔️\n\n%1 vs %2\n\nDrawing cards...",
                        duel_win: "🎉 %1 WINS! 🎉\n\nYour Card: %2 (ATK: %3)\nOpponent: %4 (ATK: %5)",
                        duel_lose: "😢 YOU LOST 😢\n\nYour Card: %1 (ATK: %2)\nOpponent: %3 (ATK: %4)"
                }
        },

        get cards() {
                const cardsDB = require("../data/cardsDatabase.js");
                return cardsDB.cards;
        },


        onStart: async function ({ message, args, getLang, event, usersData, command }) {
                const subcommand = args[0]?.toLowerCase();

                // Route to other commands
                if (subcommand === "meta" || subcommand === "deckmeta") {
                        const deckmeta = global.GoatBot.commands.get("deckmeta");
                        return deckmeta.onStart({ message, args: args.slice(1), getLang, event, usersData });
                }

                if (subcommand === "topdecks" || subcommand === "tournament") {
                        const topdecks = global.GoatBot.commands.get("topdecks");
                        return topdecks.onStart({ message, args: args.slice(1), getLang, event, usersData });
                }

                if (subcommand === "deckbuild" || subcommand === "build") {
                        const deckbuild = global.GoatBot.commands.get("deckbuild");
                        return deckbuild.onStart({ message, args: args.slice(1), getLang, event, usersData });
                }

                if (subcommand === "cards" || subcommand === "collection") {
                        const cards = global.GoatBot.commands.get("cards");
                        return cards.onStart({ message, args: args.slice(1), getLang, event, usersData });
                }

                if (subcommand === "trade") {
                        const trade = global.GoatBot.commands.get("trade");
                        return trade.onStart({ message, args: args.slice(1), getLang, event, usersData, Users: global.GoatBot.Users });
                }

                if (subcommand === "shop" || subcommand === "cardshop") {
                        const cardshop = global.GoatBot.commands.get("cardshop");
                        return cardshop.onStart({ message, args: args.slice(1), getLang, event, usersData });
                }

                // Default: draw random card
                const card = this.cards[Math.floor(Math.random() * this.cards.length)];
                return message.reply(getLang("draw", card.name, card.type, card.atk, card.def, card.effect, card.rarity));
        }
};

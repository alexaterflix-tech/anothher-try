const axios = require("axios");

module.exports = {
        config: {
                name: "aigen",
                aliases: ["anime", "animepic", "waifu"],
                version: "1.0",
                author: "Replit Agent",
                countDown: 5,
                role: 0,
                description: {
                        en: "Get random anime images (completely FREE, unlimited)"
                },
                category: "ai-image",
                guide: {
                        en: "   {pn} - Random anime girl\n   {pn} neko - Random cat girl\n   {pn} maid - Random maid\n   {pn} types - See all categories"
                }
        },

        langs: {
                en: {
                        fetching: "🎨 Fetching anime image... ⏳",
                        success: "✅ Here's your anime image! ✨",
                        error: "❌ Failed to fetch: %1",
                        types: "📚 AVAILABLE CATEGORIES 📚\n\n🔹 neko - Cat girls\n🔹 maid - Maids\n🔹 shinobu - Shinobu\n🔹 waifu - Random waifu\n🔹 husbando - Random husbando\n🔹 oppai - Big chest girls\n🔹 trap - Traps\n🔹 uniform - Uniforms\n🔹 highschool - High school girls"
                }
        },

        onStart: async function ({ message, args, getLang, event }) {
                const category = args[0]?.toLowerCase() || "waifu";

                if (category === "types" || category === "list") {
                        return message.reply(getLang("types"));
                }

                const validCategories = [
                        "neko", "maid", "shinobu", "waifu", "husbando",
                        "oppai", "trap", "uniform", "highschool"
                ];

                if (!validCategories.includes(category)) {
                        return message.reply(`❌ Invalid category!\n\nUse: *aigen types`);
                }

                try {
                        message.reply(getLang("fetching"));

                        // Fetch from waifu.pics API (completely free, super fast, no signup)
                        const endpoint = `https://api.waifu.pics/sfw/${category}`;
                        const response = await axios.get(endpoint, { timeout: 5000 });
                        
                        if (!response.data || !response.data.url) {
                                throw new Error("No image data received");
                        }

                        const imageUrl = response.data.url;
                        
                        // Download image with timeout
                        const imageResponse = await axios.get(imageUrl, { 
                                responseType: "stream",
                                timeout: 10000
                        });

                        // Send image
                        await message.reply({
                                attachment: imageResponse.data
                        });

                        return message.reply(getLang("success"));

                } catch (error) {
                        const errorMsg = error.response?.status === 404 ? "Category not found" : error.message || "Unknown error";
                        return message.reply(getLang("error", errorMsg));
                }
        }
};

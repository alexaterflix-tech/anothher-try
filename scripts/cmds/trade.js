module.exports = {
	config: {
		name: "trade",
		aliases: ["cardtrade", "sendtrade"],
		version: "1.0",
		author: "Replit Agent",
		countDown: 5,
		role: 0,
		description: {
			en: "Trade cards with other users"
		},
		category: "yugioh",
		guide: {
			en: "   {pn} @user <card> <amount> - Offer trade\n   {pn} pending - View pending trades\n   {pn} accept <id> - Accept trade\n   {pn} decline <id> - Decline trade"
		}
	},

	langs: {
		en: {
			sent: "📨 TRADE SENT 📨\n\n━━━━━━━━━━━━━━━━━━━━━\n👤 To: %1\n🎴 Cards: %2x %3\n📍 Trade ID: %4\n⏳ Status: Pending\n━━━━━━━━━━━━━━━━━━━━━",
			pending: "⏳ PENDING TRADES ⏳\n\n━━━━━━━━━━━━━━━━━━━━━\n%1\n━━━━━━━━━━━━━━━━━━━━━",
			nopending: "✅ No pending trades!",
			accepted: "✅ TRADE ACCEPTED ✅\n\n━━━━━━━━━━━━━━━━━━━━━\n📤 You gave: %1x %2\n📥 You received: %3x %4\n👤 From: %5\n━━━━━━━━━━━━━━━━━━━━━",
			declined: "❌ Trade declined",
			nocard: "❌ You don't have %1x %2",
			notfound: "❌ Trade not found"
		}
	},

	trades: new Map(),
	tradeID: 0,

	onStart: async function ({ message, args, getLang, event, usersData, Users }) {
		const userID = event.senderID;

		// View pending trades
		if (args[0]?.toLowerCase() === "pending") {
			if (this.trades.size === 0) {
				return message.reply(getLang("nopending"));
			}

			let pending = [];
			for (const [id, trade] of this.trades) {
				if (trade.to === userID) {
					pending.push(`📍 ID: ${id}\n👤 From: ${trade.fromName}\n🎴 Offer: ${trade.amount}x ${trade.card}\n💬 *trade accept ${id}`);
				}
			}

			if (pending.length === 0) {
				return message.reply(getLang("nopending"));
			}

			return message.reply(getLang("pending", pending.join("\n\n")));
		}

		// Accept trade
		if (args[0]?.toLowerCase() === "accept") {
			const tradeID = parseInt(args[1]);
			const trade = this.trades.get(tradeID);

			if (!trade) return message.reply(getLang("notfound"));
			if (trade.to !== userID) return message.reply("❌ Not your trade!");

			// Check if receiver has space & sender still has cards
			let senderCards = await usersData.get(trade.from, "data.cards") || {};
			let receiverCards = await usersData.get(userID, "data.cards") || {};

			if ((senderCards[trade.card] || 0) < trade.amount) {
				return message.reply("❌ Sender no longer has these cards!");
			}

			// Execute trade
			senderCards[trade.card] = (senderCards[trade.card] || 0) - trade.amount;
			receiverCards[trade.card] = (receiverCards[trade.card] || 0) + trade.amount;

			await usersData.set(trade.from, senderCards, "data.cards");
			await usersData.set(userID, receiverCards, "data.cards");

			this.trades.delete(tradeID);

			return message.reply(getLang("accepted", trade.amount, trade.card, trade.amount, trade.card, trade.fromName));
		}

		// Decline trade
		if (args[0]?.toLowerCase() === "decline") {
			const tradeID = parseInt(args[1]);
			const trade = this.trades.get(tradeID);

			if (!trade) return message.reply(getLang("notfound"));
			if (trade.to !== userID) return message.reply("❌ Not your trade!");

			this.trades.delete(tradeID);
			return message.reply(getLang("declined"));
		}

		// Send trade
		if (args[0]?.startsWith("@")) {
			const mentionedID = args[0].match(/\d+/)?.[0];
			if (!mentionedID) return message.reply("❌ Please mention a valid user!");

			const cardName = args.slice(1, -1).join(" ");
			const amount = parseInt(args[args.length - 1]);

			if (!cardName || !amount || isNaN(amount)) {
				return message.reply("❌ Usage: *trade @user <card name> <amount>");
			}

			// Check if sender has the card
			let senderCards = await usersData.get(userID, "data.cards") || {};
			if ((senderCards[cardName] || 0) < amount) {
				return message.reply(getLang("nocard", amount, cardName));
			}

			// Get receiver name
			const receiver = await Users.getNameByID(mentionedID);
			const sender = await Users.getNameByID(userID);

			// Create trade
			const id = this.tradeID++;
			this.trades.set(id, {
				from: userID,
				fromName: sender,
				to: mentionedID,
				toName: receiver,
				card: cardName,
				amount: amount,
				timestamp: Date.now()
			});

			message.reply(getLang("sent", receiver, amount, cardName, id));
			
			// Notify receiver
			try {
				global.GoatBot.api.sendMessage(`📨 ${sender} sent you a trade offer!\n\n🎴 ${amount}x ${cardName}\n\n💬 Use: *trade pending`, mentionedID);
			} catch (e) {}
		}
	}
};

import * as Discord from "discord.js";
import dotenv from "dotenv";
import Winston from "winston";
import auth from "../auth.json";
import MessageHandler from "./message-handler";
import MySQL from "./mysql";
import Servers from "./Servers";
// import MySQL from "./mysql";

dotenv.config();

async function main() {
	try {
		const logger = Winston.createLogger({
			transports: [new Winston.transports.Console()],
			format: Winston.format.combine(Winston.format.colorize({all: true}), Winston.format.simple()),
		});

		const bot = new Discord.Client();

		bot.on("ready", () => {
			logger.info("Connected");
			logger.info("Logged in as: ");
			logger.info(bot.user!.username + " - (" + bot.user!.id + ")");
		});

		// Initialize all required items
		await MySQL.init({
			host	 : process.env.DB_HOST,
			user     : process.env.DB_USER,
			password : process.env.DB_PASSWORD,
			database : process.env.DB_DATABASE,
			port     : Number(process.env.DB_PORT),
		});
		await Servers.init();

		console.log("ready");

		const messageHandler = new MessageHandler();
		logger.level = "debug";

		bot.on("message", (message) => {
			messageHandler.enqueue(message);
		});

		// bot.on("guildCreate", (guild) => {
		// 	console.log(guild.name);
		// 	console.log(guild.id);
		// });

		bot.login(auth.token);
	} catch (e) {
		console.log(e);
	}
}

main();

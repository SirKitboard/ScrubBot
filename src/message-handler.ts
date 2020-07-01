import * as Discord from "discord.js";
import Servers from "./Servers";

export default class MessageHandler {
	private messageQueue: Discord.Message[];
	private isWorking: boolean;

	constructor() {
		this.messageQueue = [];
		this.isWorking = false;
	}

	public enqueue(message: Discord.Message) {
		this.messageQueue.push(message);
		this.handle();
	}

	public handle() {
		if (this.isWorking) {
			return;
		}
		if (this.messageQueue.length === 0) {
			this.isWorking = false;
			return;
		}
		this.isWorking = true;
		const message = this.messageQueue.shift() as Discord.Message;

		// If the message isn't in one of the servers this bot cares about then ignore it
		const guildID = message.guild?.id;
		if (!Servers.has(guildID as string)) {
			Servers.add(message.guild?.id as string, message.guild?.name as string);
		}
		const server = Servers.get(guildID as string);

		console.log(server);
		this.isWorking = false;
		this.handle();
	}

	public isCommand(message: string) {
		if (message.indexOf("abcd") === 0) {
			console.log("hello");
			return true;
		}
		return false;
	}
}

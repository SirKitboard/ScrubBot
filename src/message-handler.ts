import * as Discord from "discord.js";
import Servers from "./Servers";
import { Server } from "./types/Server";

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

	public async handle() {
		if (this.isWorking) {
			return;
		}
		if (this.messageQueue.length === 0) {
			this.isWorking = false;
			return;
		}
		this.isWorking = true;
		const message = this.messageQueue.shift() as Discord.Message;
		try {
			// Ignore messages by the bot itself
			if (!message.author.bot) {
				// If the message isn't in one of the servers this bot cares about then ignore it
				const guildID = message.guild?.id;
				if (!Servers.has(guildID as string)) {
					Servers.add(message.guild?.id as string, message.guild?.name as string);
				}
				const server = Servers.get(guildID as string);

				if (this.isCommand(message)) {
					await this.handleCommand(message, server);
				} else if (server.log_channel) {
					const foundPattern = this.checkMessageForPatterns(message, server);
					if (foundPattern !== undefined) {
						const logChannel = message.guild?.channels.cache.get(server.log_channel);
						if (logChannel && logChannel.type === "text") {
							const messageChannel = message.guild?.channels.cache.get(message.channel.id);
							const response = new Discord.MessageEmbed().setURL(message.url)
								.setAuthor(message.author.username, message.author.avatarURL() as string)
								.setTitle("Message matched pattern!")
								.setColor("#00bac0")
								.addFields(
									{ name: "Message Body", value: message.content },
									{ name: "Matched Pattern", value: foundPattern},
									{ name: "Posted to", value: `${messageChannel?.name}`},
									{ name: "Message permalink", value: message.url},
								)
								.setTimestamp();
							(logChannel as Discord.TextChannel).send(response);
						}
					}
				}
			}
		} catch (e) {
			message.channel.send("Something went wrong");
		}
		this.isWorking = false;
		this.handle();
	}

	public checkMessageForPatterns(message: Discord.Message, server: Server): string | undefined {
		if (!server.patterns || server.patterns.length === 0) {
			// No patterns to find, return
			return;
		}
		const lowercaseMessageContent = message.content.toLocaleLowerCase();
		for (const pattern of server.patterns) {
			const patternParts = pattern.split("*");
			let foundIndex = 0;
			for (const patternPart of patternParts) {
				if (foundIndex === -1) {
					break;
				} else {
					foundIndex = lowercaseMessageContent.indexOf(patternPart, foundIndex);
					if (foundIndex !== -1) {
						foundIndex += patternPart.length;
					}
				}
			}

			if (foundIndex !== -1) {
				return pattern;
			}
		}

		return;
	}

	public isCommand(message: Discord.Message) {
		const messageContent = message.content;
		const messageSender = message.member;
		// Only server admins can give commands
		if (!messageSender?.hasPermission("ADMINISTRATOR")) {
			return false;
		}

		// But trigger keyword is mentioning the bot
		if (messageContent.indexOf("<@!726879680858161213>") !== 0) {
			return false;
		}
		return true;
	}

	private async handleCommand(message: Discord.Message, server: Server) {
		const messageSegments = message.content.split(" ");
		const command = messageSegments.length > 1 ? messageSegments[1].toLocaleLowerCase() : "";
		const args = messageSegments.slice(2);
		let result: any;
		try {
			switch (command) {
				case "add-pattern":
				case "add_pattern":
					if (args.length < 1) {
						message.channel.send("Not enough arguments");
					}
					result = await Servers.addPattern(server.id, args.join(" "));
					if (result) {
						message.channel.send("Pattern added");
					} else {
						message.channel.send("Pattern already exists");
					}
					break;
				case "remove-pattern":
				case "remove_pattern":
					if (args.length < 1) {
						message.channel.send("Not enough arguments");
					}
					result = await Servers.removePattern(server.id, args.join(" "));
					if (result) {
						message.channel.send("Pattern removed");
					} else {
						message.channel.send("Pattern does not exist");
					}
					break;

				case "list-patterns":
				case "list_patterns":
					const patterns = await Servers.getPatterns(server.id);
					let response = "** Current Patterns: **\n";
					for (const pattern of patterns) {
						response += "• " + pattern + "\n";
					}
					message.channel.send(response);
					break;
				case "set_log_channel":
				case "set-log-channel":
					if (args.length < 1) {
						message.channel.send("Not enough arguments");
					}
					if (args.length > 1) {
						message.channel.send("Too many arguments");
					}
					const channelID = args[0].substring(2, args[0].length - 1);

					const foundChannel = message.guild?.channels.cache.get(channelID);
					if (!foundChannel) {
						message.channel.send("Invalid channel, please make sure the channel name starts with #");
					} else {
						if (foundChannel.type !== "text") {
							message.channel.send("Specified channel is not a text channel");
						} else {
							result = await Servers.setLogChannel(server.id, foundChannel.id);
							if (result) {
								message.channel.send("Log channel set");
							} else {
								message.channel.send("Failed to set log channel");
							}
						}
					}
					break;
				case "help":
				default:
						message.channel.send("**All commands are prefixed with @ScrubBot**:\n" +
						(server.log_channel ? `Current log channel: <#${server.log_channel}>\n\n` : "No log channel configured\n\n") +
						"**Commands**:\n" +
						"• **help** - Display this help message\n" +
						"• **add-pattern|add_pattern** [pattern]- Add a pattern to look for, use * as the wildcard\n" +
						"• **remove-pattern|remove_pattern** [pattern] - Remove a pattern\n" +
						"• **list-patterns|list_patterns**- List current list of patterns the bot is searching for\n" +
						"• **set_log_channel|set-log-channel** #[channel-name] - Set the channel where bot lists logged messages\n");
						break;
			}
		} catch (e) {
			console.log(e);
			message.channel.send("Invalid command");
		}
	}
}

import MySQL from "./mysql";
import { Server } from "./types/Server";

export default class Servers {
	public static async init() {
		const servers: Server[] = await MySQL.query("select * from servers") as any;
		const patterns = await MySQL.query("select * from patterns") as any;
		const patternMap: {[key: string]: string[]} = {};
		for (const pattern of patterns) {
			if (pattern.server_id in patternMap) {
				patternMap[pattern.server_id].push(pattern.pattern);
			} else {
				patternMap[pattern.server_id] = [pattern.pattern];
			}
		}
		for (const result of servers) {
			this.servers[result.id] = {
				id: result.id,
				name: result.name,
				logChannelID: result.logChannelID,
				patterns: patternMap[result.id],
			};
		}

		console.log(this.servers);
	}

	public static add(id: string, name: string) {
		this.servers[id] = ({
			id, name,
		});

		MySQL.query("insert into servers(id, name) VALUES (?, ?)", [id, name]);
	}

	public static get(id: string) {
		return this.servers[id];
	}

	public static has(id: string) {
		return id in this.servers;
	}

	public static getPatterns(id: string) {
		return this.servers?.[id].patterns;
	}

	private static servers: {[key: string]: Server} = {};
}

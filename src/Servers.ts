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
				log_channel: result.log_channel,
				patterns: patternMap[result.id] || [],
			};
		}

		console.log(this.servers);
	}

	public static async add(id: string, name: string) {
		this.servers[id] = ({
			id, name,
			patterns: [],
		});

		await MySQL.query("insert into servers(id, name) VALUES (?, ?)", [id, name]);
	}

	public static async addPattern(id: string, pattern: string): Promise<boolean> {
		if (id in this.servers && this.servers[id].patterns?.indexOf(pattern) === -1) {
			this.servers[id].patterns.push(pattern);
			await MySQL.query("insert into patterns(server_id, pattern) VALUES(?, ?) ON DUPLICATE KEY SET 1 = 1", [id, pattern]);
			return true;
		}
		return false;
	}

	public static async removePattern(id: string, pattern: string): Promise<boolean> {
		if (id in this.servers && this.servers[id].patterns?.indexOf(pattern) !== -1) {
			this.servers[id].patterns.splice(this.servers[id].patterns?.indexOf(pattern), 1);
			await MySQL.query("delete from patterns where server_id = ? and pattern = ?", [id, pattern]);
			return true;
		}
		return false;
	}

	public static async setLogChannel(id: string, logChannelID: string): Promise<boolean> {
		if (id in this.servers) {
			this.servers[id].log_channel = logChannelID;
			await MySQL.query("update servers set log_channel = ? where id = ?", [logChannelID, id]);
			return true;
		}
		return false;
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

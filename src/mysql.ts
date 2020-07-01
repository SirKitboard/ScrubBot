import mysql from "mysql";
export default class MySQL {
	public static init(args: mysql.ConnectionConfig) {
		console.log(args);
		this.connection = mysql.createConnection({
			host	 : args.host,
			user     : args.user,
			password : args.password,
			database : args.database,
			port     : Number(args.port),
		});
	}

	public static query(q: string, args?: any[]) {
		return new Promise<mysql.Query>((resolve, reject) => {
			this.connection.query(q, args, (error, results) => {
				if (error) {
					reject(error);
				} else {
					resolve(results);
				}
			});
		});
	}

	private static connection: mysql.Connection;
}

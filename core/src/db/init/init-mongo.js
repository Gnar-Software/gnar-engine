
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);

var user = process.env.DB_USER;
var password = process.env.DB_PASSWORD;

db.createUser({
	user: user,
	pwd: password,
	roles: [
		{
			role: "readWrite",
			db: db.getName()
		}
	]
});
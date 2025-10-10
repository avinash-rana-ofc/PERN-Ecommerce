import pkg from "pg";
const {Client} = pkg;

const database = new Client({
    user : process.env.DB_USER,
    host : process.env.DB_HOST,
    database : process.env.DB_NAME,
    password : process.env.DB_PASSWORD,
    port : process.env.DB_PORT
});

try {
    console.log("DB_PASSWORD:", typeof process.env.DB_PASSWORD, process.env.DB_PASSWORD ? "Loaded" : "Missing");

    await database.connect();
    console.log("Database Connected Successfully.");
} catch (error) {
    console.error("Database Connection Failed.", error);
    process.exit(1);
}

export default database;
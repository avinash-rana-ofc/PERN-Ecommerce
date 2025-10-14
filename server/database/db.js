import { config } from "dotenv";
config({path : "./config/config.env"});

import pkg from "pg";
const { Client } = pkg;

const password = process.env.DB_PASSWORD?.trim();

export const database = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  password: password,
  port: process.env.DB_PORT,
});

export const connectDatabase = async () => {
  try {
    console.log("🔍 DB connection details:");
    console.log({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      passwordType: typeof process.env.DB_PASSWORD,
      passwordLength: process.env.DB_PASSWORD?.length,
      port: process.env.DB_PORT,
    });

    await database.connect();
    console.log("✅ Database Connected Successfully.");
  } catch (error) {
    console.error("❌ Database Connection Failed.", error);
    process.exit(1);
  }
};

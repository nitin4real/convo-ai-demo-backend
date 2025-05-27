import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { PlatformAdmin, PlatformUser } from "../models";
import { Feedback } from "../models/Feedback";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true, // Disable synchronize in production
    logging: false,
    entities: [PlatformAdmin, PlatformUser, Feedback],
    subscribers: [],
    migrations: [],
});
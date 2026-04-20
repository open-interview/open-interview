import { client } from "./db";

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class PostgresStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await client.execute({
      sql: "SELECT id, username, password FROM users WHERE id = $1",
      args: [id]
    });
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
      id: row.id as string,
      username: row.username as string,
      password: row.password as string
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await client.execute({
      sql: "SELECT id, username, password FROM users WHERE username = $1",
      args: [username]
    });
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
      id: row.id as string,
      username: row.username as string,
      password: row.password as string
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    await client.execute({
      sql: "INSERT INTO users (id, username, password) VALUES ($1, $2, $3)",
      args: [id, insertUser.username, insertUser.password]
    });
    return { id, ...insertUser };
  }
}

export const storage = new PostgresStorage();

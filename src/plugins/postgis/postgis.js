import { Pool } from 'pg';
import ora from 'ora';

class PostgresPlugin {
  #pool = null;

  constructor({ database, hostname, port, user, password, populate, connection_timeout }) {
    this.database = database ?? 'map';
    this.user = user ?? 'postgres';
    this.hostname = hostname ?? 'localhost';
    this.port = port ?? 5432;
    this.password = password ?? '';
    this.populate = populate ?? false;
    this.connection_timeout = connection_timeout ?? 60_000;
  }

  async connect() {
    const console_connection = ora({
      discardStdin: false,
      text: 'Creating PostgreSQL connection',
    }).start();

    try {
      this.#pool = new Pool({
        user: this.user,
        host: this.hostname,
        database: this.database,
        password: this.password,
        port: this.port,
      });

      await this.#pool.query('SELECT NOW()');

      console_connection.succeed(`Connected to database ${this.database}`);

      if (this.populate) {
        // TODO: Add your Postgres and PostGIS schema creation queries here
        // You need to recreate the tables and schema as per your requirements.
        // The example below only shows a basic query to check if the schema exists.
      }
    } catch (error) {
      console_connection.fail('Failed to connect to PostgreSQL');
      throw error;
    }
  }

  async disconnect() {
    if (!this.#pool) return;
    await this.#pool.end();
  }

  // async query(query) {
  //   try {
  //     await this.#pool.query(query);
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}

export default PostgresPlugin;
import SurrealDB from 'surrealdb.js';
import ora from 'ora';

export default class SurrealdbConnection {
  #connection = null;

  constructor({
    database,
    hostname,
    port,
    user,
    password,
    populate,
    connection_timeout,
  }) {
    this.database = database;
    this.user = user;
    this.hostname = hostname ?? 'localhost';
    this.port = port ?? 8000;
    this.password = password ?? '';
    this.populate = populate ?? false;
    this.connection_timeout = connection_timeout ?? 60_000;
  }

  async connect() {
    const console_connection = ora({
      discardStdin: false,
      text: 'Creating SurrealDB connection',
    }).start();

    if (this.populate) {
      try {
        let delete_connection = await this.#conectionWithTimeout({
          timeout: this.connection_timeout,
        });

        console_connection.succeed('Connected to SurrealDB');

        await delete_connection.use({ ns: 'root', db: this.database });

        await delete_connection.query('REMOVE TABLE nodes');
        await delete_connection.query('REMOVE TABLE ways');
        await delete_connection.query('REMOVE TABLE relations');
        await delete_connection.close();
      } catch (error) {
        console_connection.fail('Failed to connect to MongoDB');
        throw error;
      }
    }

    try {
      this.#connection = await this.#conectionWithTimeout({
        timeout: this.connection_timeout,
        database: this.database,
      });

      this.#connection.use({ ns: 'root', db: this.database });

      this.#connection.query('DEFINE TABLE nodes');
      this.#connection.query('DEFINE TABLE ways');
      this.#connection.query('DEFINE TABLE relations');

      console_connection.succeed('Table nodes and ways created');
    } catch (error) {
      console_connection.fail('Failed to connect to SurrealDB');
      throw error;
    }
  }

  async query(query) {
    await this.#connection.query(query);
  }

  async insert(table, data) {
    await this.#connection.insert(table, data);
  }

  async disconnect() {
    await this.#connection.close();
  }

  async #conectionWithTimeout({ timeout }) {
    const retryInterval = 5_000;
    const startTime = Date.now();

    const db = new SurrealDB();
    const url = `http://${this.hostname}:${this.port}/rpc`;
    const config = { auth: { user: this.user, pass: this.password } };

    // await db.wait();
    let lastError = null;

    while (Date.now() - startTime < timeout) {
      try {
        await db.connect(url, config);
        return db;
      } catch (error) {
        lastError = error;
        console.log(error);
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }

    throw new Error(
      `Database connection timeout after attempt for ${timeout}ms\n\n`,
      lastError
    );
  }
}

import { MongoClient } from 'mongodb';
import ora from 'ora';
// eslint-disable-next-line no-unused-vars
// import { exit } from 'process';

class MongodbConnection {
  #connection = null;
  #connectionDB = null;

  constructor({
    database,
    hostname,
    port,
    user,
    password,
    populate,
    connection_timeout,
  }) {
    this.database = database ?? 'map';
    this.user = user;
    this.hostname = hostname ?? 'localhost';
    this.port = port ?? 27017;
    this.password = password ?? '';
    this.populate = populate ?? false;
    this.connection_timeout = connection_timeout ?? 60_000;
  }

  async connect() {
    const console_connection = ora({
      discardStdin: false,
      text: 'Creating MongoDB connection',
    }).start();

    if (this.populate) {
      try {
        let deleteConnection = await this.#connectWithTimeout({
          timeout: this.connection_timeout,
        });

        console_connection.succeed('Connected to MongoDB');
        const db = deleteConnection.db(this.database);
        const nodes_collection = db.collection('nodes');
        await nodes_collection.deleteMany({});
        const ways_collection = db.collection('ways');
        await ways_collection.deleteMany({});
        const relations_collection = db.collection('relations');
        await relations_collection.deleteMany({});
        deleteConnection.close();
      } catch (error) {
        console.log(error);
        console_connection.fail('Failed to connect to MongoDB');
        throw error;
      }
    }

    try {
      this.#connection = await this.#connectWithTimeout({
        timeout: this.connection_timeout,
        database: this.database,
      });

      this.#connectionDB = this.#connection.db(this.database);

      console_connection.succeed(`Connected to database ${this.database}`);
    } catch (error) {
      console.log(error);
      console_connection.fail('Failed to connect to MongoDB');
      throw error;
    }

    // exit(0);
  }

  async disconnect() {
    await this.#connection.close();
  }

  nodes_collection() {
    return this.#connectionDB.collection('nodes');
  }

  ways_collection() {
    return this.#connectionDB.collection('ways');
  }

  relations_collection() {
    return this.#connectionDB.collection('relations');
  }

  async #connectWithTimeout({ timeout, database }) {
    const retryInterval = 5_000;
    const startTime = Date.now();

    const url = `mongodb://${this.user}:${this.password}@${this.hostname}:${
      this.port
    }/${database ? database : ''}?authSource=admin`;

    const client = new MongoClient(url, { useNewURLParser: true });
    let lastError = null;

    while (Date.now() - startTime < timeout) {
      try {
        await client.connect();
        return client;
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

export default MongodbConnection;

import neo4j from 'neo4j-driver';
import ora from 'ora';
// eslint-disable-next-line no-unused-vars
import { exit } from 'process';

class Neo4jConnection {
  #session = null;
  #driver = null;

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
    this.hostname = hostname ?? 'localhost';
    this.port = port ?? 7687;
    this.user = user;
    this.password = password ?? '';
    this.populate = populate ?? false;
    this.connection_timeout = connection_timeout ?? 60_000;
  }

  async connect() {
    const console_connection = ora({
      discardStdin: false,
      text: 'Creating Neo4j connection',
    }).start();

    let driver;

    if (this.populate) {
      try {
        driver = await this.#connectionWithTimeout({
          timeout: this.connection_timeout,
        });

        console_connection.succeed('Connected to Neo4j');
        let session = driver.session();

        await session.run(`MATCH (n) DETACH DELETE n;`);
      } catch (error) {
        console.log(error);
        console_connection.fail('Failed to connect to Neo4j');
        throw error;
      }
    }

    try {
      driver = await this.#connectionWithTimeout({
        timeout: this.connection_timeout,
        database: this.database,
      });

      this.#driver = driver;
      this.#session = driver.session();

      console_connection.succeed(`Connected to database ${this.database}`);
    } catch (error) {
      console.log(error);
      console_connection.fail('Failed to connect to Neo4j');
      throw error;
    }
  }

  async query(query, params) {
    // console.log('rest', ...rest);
    // console.log({ ...rest });
    let cur_session = this.#driver.session();
    let result = await cur_session.run(query, { ...params });
    cur_session.close();
    return result;
  }

  async disconnect() {
    if (this.#driver) {
      // await this.#session.close();
      // this.#session = null;
      await this.#driver.close();
      this.#driver = null;
    }
  }

  async #connectionWithTimeout({ timeout, database }) {
    const retryInterval = 5_000;
    const start = Date.now();

    const connection = neo4j.driver(
      `neo4j://${this.hostname}:${this.port}/neo4j`,
      neo4j.auth.basic(this.user, this.password),
      {
        maxConnectionLifetime: this.connection_timeout,
        maxConnectionPoolSize: 50,
        database,
      }
    );

    let lastError = null;

    while (Date.now() - start < timeout) {
      try {
        await connection.getServerInfo();
        return connection;
      } catch (error) {
        lastError = error;
        // ServiceUnavailable
        if (error.code === 'ECONNREFUSED') {
          console.error(`Connection refused. Retrying in ${retryInterval}ms`);
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
          continue;
        } else {
          throw error;
        }
      }
    }
    throw new Error(
      `Database connection timeout after attempt for ${timeout}ms\n\n`,
      lastError
    );
  }
}

export default Neo4jConnection;

// await session.run(`CALL apoc.create.nodes(['Point'], [
//   {id: 1, location: point({latitude: -22.9068, longitude: -43.1729})},
//   {id: 2, location: point({latitude: -23.5505, longitude: -46.6333})}
// ])`);

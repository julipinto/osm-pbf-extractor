import postgres from 'pg';
import ora from 'ora';

// eslint-disable-next-line no-unused-vars
import { exit } from 'process';

// console_connection.succeed(`Connected to database ${this.database}`);

class PostgresConnection {
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

    if (this.populate) {
      try {
        let deleteConnection = await this.#conectionWithTimeout({
          timeout: this.connection_timeout,
        });

        console_connection.succeed('Connected to PostgreSQL');

        console_connection.start(
          'Creating Postgres database with default schema'
        );

        await deleteConnection.query(`
            SELECT pg_terminate_backend (pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '${this.database}';
          `);

        // Delete all database

        await deleteConnection.query(
          `DROP TABLE IF EXISTS ${this.database}.nodes CASCADE;`
        );

        await deleteConnection.query(
          `DROP TABLE IF EXISTS ${this.database}.ways CASCADE;`
        );

        await deleteConnection.query(
          `DROP SCHEMA IF EXISTS ${this.database} CASCADE;`
        );

        // Exclua o banco de dados se ele existir
        await deleteConnection.query(
          `DROP DATABASE IF EXISTS ${this.database};`
        );

        await deleteConnection.query(
          `CREATE SCHEMA IF NOT EXISTS ${this.database};`
        );

        await deleteConnection.query(`CREATE DATABASE ${this.database};`);

        deleteConnection.end();

        let populateConnection = await this.#conectionWithTimeout({
          timeout: this.connection_timeout,
          database: this.database,
        });

        await populateConnection.query(
          'CREATE EXTENSION IF NOT EXISTS postgis;'
        );
        // Create database

        await populateConnection.query(
          `CREATE TABLE nodes (node_id bigint NOT NULL, location geometry(Point, 4326) NOT NULL, PRIMARY KEY (node_id));`
        );
        await populateConnection.query(
          `CREATE TABLE node_tags (node_id bigint NOT NULL, tag_key varchar(255) NOT NULL, tag_value varchar(255) NOT NULL, PRIMARY KEY (node_id, tag_key), CONSTRAINT fk_node_tags_nodes FOREIGN KEY (node_id) REFERENCES nodes (node_id));`
        );
        await populateConnection.query(
          `CREATE TABLE ways (way_id bigint NOT NULL, way_line geometry(LineString, 4326), PRIMARY KEY (way_id));`
        );
        await populateConnection.query(
          `CREATE TABLE way_tags (way_id bigint NOT NULL, tag_key varchar(255) NOT NULL, tag_value varchar(255) NOT NULL, PRIMARY KEY (way_id, tag_key), CONSTRAINT fk_way_tags_ways FOREIGN KEY (way_id) REFERENCES ways (way_id));`
        );
        await populateConnection.query(
          `CREATE TABLE way_nodes ( way_id bigint NOT NULL, node_id bigint NOT NULL, sequence_index int NOT NULL, PRIMARY KEY (way_id, sequence_index), CONSTRAINT fk_way_nodes_ways FOREIGN KEY (way_id) REFERENCES ways (way_id), CONSTRAINT fk_way_nodes_nodes FOREIGN KEY (node_id) REFERENCES nodes (node_id));`
        );

        await populateConnection.end();
      } catch (error) {
        console.error(error);
        console_connection.fail('Failed to populate PostgreSQL database');
      }
    }

    try {
      this.#connection = await this.#conectionWithTimeout({
        timeout: this.connection_timeout,
        database: this.database,
      });

      console_connection.succeed(`Connected to database ${this.database}`);

      await this.#init();
    } catch (error) {
      console_connection.fail('Failed to connect to PostgreSQL');
      throw error;
    }
  }

  async #init() {
    await this.#connection.query('BEGIN;');
    await this.#connection.query(
      'LOCK TABLE nodes, node_tags, ways, way_tags, way_nodes IN ACCESS EXCLUSIVE MODE;'
    );
    // Executa outras ações dentro da transação (se houver)
    await this.#connection.query("SET session_replication_role = 'replica';");
    await this.#connection.query('COMMIT;');
  }

  async disconnect() {
    if (!this.#connection) return;
    await this.#connection.end();
  }

  async query(query) {
    return this.#connection.query(query);
  }

  async #conectionWithTimeout({ timeout, database }) {
    const retryInterval = 5_000;
    const start = Date.now();
    let config = {
      host: this.hostname,
      port: this.port,
      user: this.user,
      password: this.password,
    };

    if (database) config.database = database;

    let lastError = null;

    const connection = new postgres.Pool(config);

    while (Date.now() - start < timeout) {
      try {
        await connection.query('SELECT NOW()');
        return connection;
      } catch (error) {
        lastError = error;
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

export default PostgresConnection;

// await populateConnection.query(
//   `CREATE TABLE ${this.database}.nodes (node_id bigint NOT NULL, location geometry(Point, 4326) NOT NULL, PRIMARY KEY (node_id));`
// );
// await populateConnection.query(
//   `CREATE TABLE ${this.database}.node_tags (node_id bigint NOT NULL, tag_key varchar(255) NOT NULL, tag_value varchar(255) NOT NULL, PRIMARY KEY (node_id, tag_key), CONSTRAINT fk_node_tags_nodes FOREIGN KEY (node_id) REFERENCES ${this.database}.nodes (node_id));`
// );
// await populateConnection.query(
//   `CREATE TABLE ${this.database}.ways (way_id bigint NOT NULL, way_line geometry(LineString, 4326), PRIMARY KEY (way_id));`
// );
// await populateConnection.query(
//   `CREATE TABLE ${this.database}.way_tags (way_id bigint NOT NULL, tag_key varchar(255) NOT NULL, tag_value varchar(255) NOT NULL, PRIMARY KEY (way_id, tag_key), CONSTRAINT fk_way_tags_ways FOREIGN KEY (way_id) REFERENCES ${this.database}.ways (way_id));`
// );
// await populateConnection.query(
//   `CREATE TABLE ${this.database}.way_nodes ( way_id bigint NOT NULL, node_id bigint NOT NULL, sequence_index int NOT NULL, PRIMARY KEY (way_id, sequence_index), CONSTRAINT fk_way_nodes_ways FOREIGN KEY (way_id) REFERENCES ${this.database}.ways (way_id), CONSTRAINT fk_way_nodes_nodes FOREIGN KEY (node_id) REFERENCES ${this.database}.nodes (node_id));`
// );

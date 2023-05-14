// const mysql = require('mysql2/promise');
import mysql from 'mysql2/promise';
import { paint } from '../utils/concolecolor.js';
import ora from 'ora';

class MysqlPlugin {
  #connection = null;

  constructor({ name, database, hostname, port, user, password }) {
    this.name = name ?? 'mysql';
    this.database = database ?? 'map';
    this.user = user ?? 'root';
    this.hostname = hostname ?? 'localhost';
    this.port = port ?? 3306;
    this.password = password ?? '';
  }

  async connect() {
    const console_connection = ora({
      discardStdin: false,
      text: 'Creating MySQL connection',
    }).start();

    try {
      this.#connection = await mysql.createConnection({
        host: this.hostname,
        port: this.port,
        user: this.user,
        password: this.password,
        database: this.database,
      });
      console_connection.succeed('Connected to MySQL');
    } catch (error) {
      console_connection.fail('Failed to connect to MySQL');
      throw error;
    }
  }

  async disconnect() {
    if (!this.#connection) return;
    await this.#connection.end();
  }

  async query(query) {
    await this.#connection.query(query);
  }
}

export default MysqlPlugin;

// Measure-Command { osmosis --read-pbf bahia.osm.pbf --write-apidb dbType="mysql" database="bahia" user="root" password="1234" validateSchemaVersion=no }

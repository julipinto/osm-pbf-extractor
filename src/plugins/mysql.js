// const mysql = require('mysql2/promise');
import mysql from 'mysql2/promise';
import { paint } from '../utils/concolecolor.js';
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
    console.log('Creating connection to MySQL', paint('...', 'Yellow'));
    this.#connection = await mysql.createConnection({
      host: this.hostname,
      port: this.port,
      user: this.user,
      password: this.password,
      database: this.database,
    });

    console.log('Connected to MySQL', paint('✓', 'Green'));
  }

  async disconnect() {
    if (!this.#connection) return;
    console.log('Disconnecting from MySQL', paint('...', 'Yellow'));
    await this.connection.end();
    console.log('Disconnected from MySQL', paint('✓', 'Green'));
  }

  async query(query) {
    await this.#connection.query(query);
  }
}

export default MysqlPlugin;

// Measure-Command { osmosis --read-pbf bahia.osm.pbf --write-apidb dbType="mysql" database="bahia" user="root" password="1234" validateSchemaVersion=no }

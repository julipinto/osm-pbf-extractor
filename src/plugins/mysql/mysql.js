// const mysql = require('mysql2/promise');
import mysql from 'mysql2/promise';
import ora from 'ora';

class MysqlPlugin {
  #connection = null;

  constructor({ database, hostname, port, user, password, populate}) {
    this.database = database ?? 'map';
    this.user = user ?? 'root';
    this.hostname = hostname ?? 'localhost';
    this.port = port ?? 3306;
    this.password = password ?? '';
    this.populate = populate ?? false;
  }

  async connect() {
    const console_connection = ora({
      discardStdin: false,
      text: 'Creating MySQL connection',
    }).start();

    if (this.populate) {
      try {
        let populateConnection = await mysql.createConnection({
          host: this.hostname,
          port: this.port,
          user: this.user,
          password: this.password,
        });

        console_connection.start('Creating MySQL database with default schema');
        await populateConnection.query(`DROP DATABASE ${this.database}`);
        await populateConnection.query(`CREATE DATABASE ${this.database}`);
        await populateConnection.query(`CREATE TABLE \`${this.database}\`.\`nodes\` ( \`node_id\` bigint(64) NOT NULL, \`location\` POINT NOT NULL SRID 0, PRIMARY KEY (node_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        await populateConnection.query(`CREATE TABLE \`${this.database}\`.\`node_tags\` (\`node_id\` bigint(64) NOT NULL, \`tag_key\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL default '', \`tag_value\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL default '', PRIMARY KEY (\`node_id\`, \`tag_key\`), CONSTRAINT \`node_tags_ibfk_1\` FOREIGN KEY (\`node_id\`) REFERENCES \`nodes\` (\`node_id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        await populateConnection.query(`CREATE TABLE \`${this.database}\`.\`ways\` (\`way_id\` bigint(64) NOT NULL, PRIMARY KEY (\`way_id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        await populateConnection.query(`CREATE TABLE \`${this.database}\`.\`way_tags\` (\`way_id\` bigint(64) NOT NULL, \`tag_key\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL default '', \`tag_value\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL default '', PRIMARY KEY (\`way_id\`,\`tag_key\`), CONSTRAINT \`way_tags_ibfk_1\` FOREIGN KEY (\`way_id\`) REFERENCES \`ways\` (\`way_id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
        await populateConnection.query(`CREATE TABLE \`${this.database}\`.\`way_nodes\` (\`way_id\` bigint(64) NOT NULL, \`node_id\` bigint(64) NOT NULL, \`sequence_index\` int(11) NOT NULL, PRIMARY KEY (\`way_id\`,\`sequence_index\`), CONSTRAINT \`way_nodes_ibfk_1\` FOREIGN KEY (\`way_id\`) REFERENCES \`ways\` (\`way_id\`), CONSTRAINT \`way_nodes_ibfk_2\` FOREIGN KEY (\`node_id\`) REFERENCES \`nodes\` (\`node_id\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

        console_connection.succeed('MySQL database created with default schema');
        await populateConnection.end();
      } catch (error) {
        console_connection.fail('Failed to populate MySQL database');
        throw error;
      }
    }


    try {
      this.#connection = await mysql.createConnection({
        host: this.hostname,
        port: this.port,
        user: this.user,
        password: this.password,
        database: this.database,
      });

      console_connection.succeed('Connected to MySQL');

      await this.init();
    } catch (error) {
      console_connection.fail('Failed to connect to MySQL');
      throw error;
    }
  }

  async init() {
    await this.#connection.query(
      'LOCK TABLES nodes WRITE, node_tags WRITE, ways WRITE, way_tags WRITE, way_nodes WRITE'
    );
    await this.#connection.query('SET FOREIGN_KEY_CHECKS = 0;');
  }

  async disconnect() {
    if (!this.#connection) return;
    await this.#connection.query('UNLOCK TABLES');
    await this.#connection.end();
  }

  async query(query) {
    try {
      await this.#connection.query(query);
    } finally {
      await this.#connection.query('UNLOCK TABLES');
    }
  }
}


export default MysqlPlugin;

// Measure-Command { osmosis --read-pbf bahia.osm.pbf --write-apidb dbType="mysql" database="bahia" user="root" password="1234" validateSchemaVersion=no }

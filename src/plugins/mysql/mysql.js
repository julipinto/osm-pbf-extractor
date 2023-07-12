// const mysql = require('mysql2/promise');
import mysql from 'mysql2/promise';
import ora from 'ora';

class MysqlPlugin {
  #connection = null;

  constructor({ name, database, hostname, port, user, password, populate}) {
    this.name = name ?? 'mysql';
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

    try {
      this.#connection = await mysql.createConnection({
        host: this.hostname,
        port: this.port,
        user: this.user,
        password: this.password,
        database: this.database,
      });

      console_connection.succeed('Connected to MySQL');

      if (this.populate) {
        await this.#connection.query(populationQuery(this.database));
      }

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

function populationQuery(dbName) {
  return(`
DROP DATABASE ${dbName};

CREATE DATABASE IF NOT EXISTS ${dbName}
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE ${dbName};

CREATE TABLE \`${dbName}\`.\`nodes\` (
  \`node_id\` bigint(64) NOT NULL,
  \`location\` POINT NOT NULL SRID 0,
  PRIMARY KEY (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`${dbName}\`.\`node_tags\` (
  \`node_id\` bigint(64) NOT NULL,
  \`tag_key\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL default '',
  \`tag_value\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL default '',
  PRIMARY KEY (\`node_id\`, \`tag_key\`),
  CONSTRAINT \`node_tags_ibfk_1\` FOREIGN KEY (\`node_id\`) REFERENCES \`nodes\` (\`node_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`${dbName}\`.\`ways\` (
  \`way_id\` bigint(64) NOT NULL,
  PRIMARY KEY  (\`way_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`${dbName}\`.\`way_tags\` (
  \`way_id\` bigint(64) NOT NULL,
  \`tag_key\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL default '',
  \`tag_value\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL default '',
  PRIMARY KEY  (\`way_id\`,\`tag_key\`),
  CONSTRAINT \`way_tags_ibfk_1\` FOREIGN KEY (\`way_id\`) REFERENCES \`ways\` (\`way_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`${dbName}\`.\`way_nodes\` (
  \`way_id\` bigint(64) NOT NULL,
  \`node_id\` bigint(64) NOT NULL,
  \`sequence_index\` int(11) NOT NULL,
  PRIMARY KEY  (\`way_id\`,\`sequence_index\`),
  CONSTRAINT \`way_nodes_ibfk_1\` FOREIGN KEY (\`way_id\`) REFERENCES \`ways\` (\`way_id\`),
  CONSTRAINT \`way_nodes_ibfk_2\` FOREIGN KEY (\`node_id\`) REFERENCES \`nodes\` (\`node_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
}

export default MysqlPlugin;

// Measure-Command { osmosis --read-pbf bahia.osm.pbf --write-apidb dbType="mysql" database="bahia" user="root" password="1234" validateSchemaVersion=no }

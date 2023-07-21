// import { parse, serialize } from 'pg-geometry';
import PostgresPlugin from './PostgresPlugin';

class PostgresQueryBuilder {
  nodes = [];
  node_tags = [];
  ways = [];
  way_tags = [];
  way_nodes = [];

  constructor(INSERTION_LIMIT, spinner) {
    this.server = null;
    this.INSERTION_LIMIT = INSERTION_LIMIT;
    this.spinner = spinner;
  }

  async init(args) {
    this.server = new PostgresPlugin(args);
    await this.server.connect();
  }

  async close() {
    await this.server.disconnect();
  }

  async #sanitize(str) {
    // Your sanitize implementation for Postgres goes here (if required)
    return str;
  }

  async insertNode(id, lat, lon) {
    this.spinner.load('nodes');

    this.nodes.push({ id, lat, lon });
    if (this.nodes.length >= this.INSERTION_LIMIT) await this.flushNodes();
  }

  async flushNodes() {
    if (this.nodes.length == 0) return;
    // const values = this.nodes.map(({ id, lat, lon }) => `(${id}, '${serialize('Point', [lat, lon])}')`);
    // const query = `INSERT INTO nodes (node_id, location) VALUES ${values.join(',')};`;

    // await this.server.query(query);
    this.nodes = [];
  }

  // ... Implement other methods similarly using Postgres and PostGIS syntax

  async flushAll() {
    await this.flushNodes();
    await this.flushNodeTags();
    await this.flushWays();
    await this.flushWayTags();
    await this.flushWayNodes();
  }
}

export default PostgresQueryBuilder;

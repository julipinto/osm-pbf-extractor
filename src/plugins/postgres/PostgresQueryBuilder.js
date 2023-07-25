// import { parse, serialize } from 'pg-geometry';
import PostgresConnection from './PostgresConnection.js';

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
    this.server = new PostgresConnection(args);
    await this.server.connect();
  }

  async close() {
    await this.server.disconnect();
  }

  async #sanitize(str) {
    return str.replaceAll(`\\`, `\\\\"`).replaceAll(`'`, `\\'`);
  }

  async insertNode(id, lat, lon) {
    this.spinner.load('nodes');

    this.nodes.push(`(${id}, ST_GeomFromText('POINT(${lat}, ${lon})', 4326))`);
    if (this.nodes.length >= this.INSERTION_LIMIT) await this.flushNodes();
  }

  async flushNodes() {
    if (this.nodes.length == 0) return;
    const query = `INSERT INTO nodes (node_id, location) VALUES ${this.nodes.join(
      ','
    )};`;

    await this.server.query(query);
    this.nodes = [];
  }

  async insertNodeTag(id, key, value) {
    this.spinner.load('node_tags');

    this.node_tags.push(
      `(${id}, '${this.#sanitize(key)}', '${this.#sanitize(value)}')`
    );
    if (this.node_tags.length >= this.INSERTION_LIMIT) {
      // await this.flushNodes();
      await this.flushNodeTags();
    }
  }

  async flushNodeTags() {
    if (this.node_tags.length == 0) return;
    const query = `INSERT INTO node_tags (node_id, tag_key, tag_value) VALUES ${this.node_tags.join(
      ','
    )};`;
    await this.server.query(query);
    this.node_tags = [];
  }

  async insertWay(id) {
    this.spinner.load('ways');

    this.ways.push(`(${id})`);
    if (this.ways.length >= this.INSERTION_LIMIT) await this.flushWays();
  }

  async flushWays() {
    if (this.ways.length == 0) return;
    const query = `INSERT INTO ways (way_id) VALUES ${this.ways.join(',')};`;
    await this.server.query(query);
    this.ways = [];
  }

  async insertWayTag(id, key, value) {
    this.spinner.load('way_tags');

    this.way_tags.push(
      `(${id}, '${this.#sanitize(key)}', '${this.#sanitize(value)}')`
    );
    if (this.way_tags.length >= this.INSERTION_LIMIT) {
      // await this.flushWays();
      await this.flushWayTags();
    }
  }

  async flushWayTags() {
    if (this.way_tags.length == 0) return;
    const query = `INSERT INTO way_tags (way_id, tag_key, tag_value) VALUES ${this.way_tags.join(
      ','
    )};`;
    await this.server.query(query);
    this.way_tags = [];
  }

  async insertWayNode(way_id, node_id, sequence_index) {
    this.spinner.load('way_nodes');

    this.way_nodes.push(`(${way_id}, ${node_id}, ${sequence_index})`);
    if (this.way_nodes.length >= this.INSERTION_LIMIT) {
      await this.flushWayNodes();
    }
  }

  async flushWayNodes() {
    if (this.way_nodes.length == 0) return;
    const query = `INSERT INTO way_nodes (way_id, node_id, sequence_index) VALUES ${this.way_nodes.join(
      ','
    )};`;
    await this.server.query(query);

    this.way_nodes = [];
  }

  // async insertNode(id, lat, lon) {
  //   this.spinner.load('nodes');

  //   this.nodes.push({ id, lat, lon });
  //   if (this.nodes.length >= this.INSERTION_LIMIT) await this.flushNodes();
  // }

  // async flushNodes() {
  //   if (this.nodes.length == 0) return;
  //   // const values = this.nodes.map(({ id, lat, lon }) => `(${id}, '${serialize('Point', [lat, lon])}')`);
  //   // const query = `INSERT INTO nodes (node_id, location) VALUES ${values.join(',')};`;

  //   // await this.server.query(query);
  //   this.nodes = [];
  // }

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

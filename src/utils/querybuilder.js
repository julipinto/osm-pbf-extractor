class QueryBuilder {
  nodes = [];
  node_tags = [];
  ways = [];
  way_tags = [];
  way_nodes = [];

  constructor(server, insertionLimit, spinner) {
    this.server = server;
    this.insertionLimit = insertionLimit;
    this.spinner = spinner;
  }

  #sanitize(str) {
    return str.replaceAll(`'`, `\\'`);
  }

  async insertNode(id, lat, lon) {
    this.spinner.load('nodes');

    this.nodes.push(`(${id}, POINT(${lat}, ${lon}))`);
    if (this.nodes.length >= this.insertionLimit) await this.flushNodes();
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
    if (this.node_tags.length >= this.insertionLimit) {
      await this.flushNodes();
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
    if (this.ways.length >= this.insertionLimit) await this.flushWays();
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
    if (this.way_tags.length >= this.insertionLimit) {
      await this.flushWays();
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
    if (this.way_nodes.length >= this.insertionLimit) {
      await this.flushNodes();
      await this.flushWays();
      await this.flushWayNodes();
    }
  }

  async flushWayNodes() {
    if (this.way_nodes.length == 0) return;
    const query = `INSERT INTO way_nodes (way_id, node_id, sequence_index) VALUES ${this.way_nodes.join(
      ','
    )};`;
    await this.server.query('SET FOREIGN_KEY_CHECKS = 0;');
    await this.server.query(query);
    await this.server.query('SET FOREIGN_KEY_CHECKS = 1;');

    this.way_nodes = [];
  }

  async flushAll() {
    await this.flushNodes();
    await this.flushNodeTags();
    await this.flushWays();
    await this.flushWayTags();
    await this.flushWayNodes();
  }
}

export default QueryBuilder;

import MysqlConnection from './MysqlConnection.js';

class MySQLQueryBuilder {
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
    this.server = new MysqlConnection(args);
    await this.server.connect();
  }

  async close() {
    await this.server.disconnect();
  }

  #sanitize(str) {
    return str.replaceAll(`\\`, `\\\\"`).replaceAll(`'`, `\\'`);
  }

  /////////////////////////////////////////////////////////

  async handleNode(node) {
    await this.insertNode(node.id, node.lat, node.lon);

    // Iterate through tags if has any
    if (node.tags) {
      for (let [key, value] of Object.entries(node.tags)) {
        await this.insertNodeTag(node.id, key, value);
      }
    }
  }

  async handleWay(way) {
    await this.insertWay(way.id);

    // Iterate through tags if has any
    if (way.tags) {
      for (let [key, value] of Object.entries(way.tags)) {
        await this.insertWayTag(way.id, key, value);
      }
    }

    // Iterate through refs if has any
    if (way.refs) {
      for (let i = 0; i < way.refs.length; i++) {
        await this.insertWayNode(way.id, way.refs[i], i);
      }
    }
  }

  /////////////////////////////////////////////////////////

  async insertNode(id, lat, lon) {
    this.spinner.load('nodes');

    // this.nodes.push(`(${id}, POINT(${lat}, ${lon}))`);
    this.nodes.push(`(${id}, ST_GeomFromText('POINT(${lon} ${lat})', 0))`);
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

  async flushAll() {
    await this.flushNodes();
    await this.flushNodeTags();
    await this.flushWays();
    await this.flushWayTags();
    await this.flushWayNodes();
  }

  async finishQuery() {
    // Create way_line column
    // this.spinner.load('ways - way_line column');
    // // const query = `BEGIN; DROP TABLE IF EXISTS temp_way_lines; CREATE TEMPORARY TABLE temp_way_lines AS SELECT wn.way_id, ST_GeomFromText(CONCAT('LINESTRING(', GROUP_CONCAT(CONCAT(ST_X(n.location), ' ', ST_Y(n.location)) ORDER BY wn.sequence_index SEPARATOR ','), ')')) AS way_line FROM way_nodes AS wn JOIN nodes AS n ON wn.node_id = n.node_id GROUP BY wn.way_id; UPDATE ways AS w JOIN temp_way_lines AS temp ON w.way_id = temp.way_id SET w.way_line = temp.way_line; COMMIT;`
    // // await this.server.query(query);
    // try {
    //   await this.server.query('SET GLOBAL group_concat_max_len = 446744073709551615;')
    //   await this.server.beginTransaction();
    //   await this.server.query('BEGIN;');
    //   await this.server.query('DROP TABLE IF EXISTS temp_way_lines;');
    //   await this.server.query(`CREATE TEMPORARY TABLE temp_way_lines SELECT wn.way_id, ST_GeomFromText(CONCAT('LINESTRING(', GROUP_CONCAT(CONCAT(ST_X(n.location), ' ', ST_Y(n.location)) ORDER BY wn.sequence_index SEPARATOR ','), ')')) AS way_line FROM way_nodes AS wn JOIN nodes AS n ON wn.node_id = n.node_id GROUP BY wn.way_id;`);
    //   await this.server.query('UPDATE ways AS w JOIN temp_way_lines AS temp ON w.way_id = temp.way_id SET w.way_line = temp.way_line;');
    //   await this.server.query('COMMIT;');
    //   await this.server.commit();
    // } catch (error) {
    //   await this.server.rollback();
    //   throw error;
    // } finally {
    //   await this.server.query('SET GLOBAL group_concat_max_len = @@global.group_concat_max_len;')
    // }
  }
}

export default MySQLQueryBuilder;

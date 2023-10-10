import Neo4jConnection from './Neo4jConnection.js';

class Nqo4jQueryBuilder {
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
    this.server = new Neo4jConnection(args);
    await this.server.connect();
  }

  async close() {
    await this.server.disconnect();
  }

  #sanitize_value(str) {
    let s = str.replaceAll(`\\`, `\\\\"`).replaceAll(`'`, `\\'`);

    // return s.includes(':') || s.includes(' ') ? '`' + s + '`' : "'" + s + "'";
    return "'" + s + "'";
  }

  #sanitize_key(str) {
    return str.includes(':') || str.includes(' ') ? '`' + str + '`' : str;
  }

  /////////////////////////////////////////////////////////

  async handleNode(node) {
    this.spinner.load('nodes');
    let str_node_tags = '';

    if (node?.tags?.location) {
      node.tags.location_tag = node.tags.location;
      delete node.tags.location;
    }

    if (node.tags) {
      for (let [key, value] of Object.entries(node.tags)) {
        str_node_tags += `, ${this.#sanitize_key(key)}: ${this.#sanitize_value(
          value
        )}`;
      }
    }

    this.nodes.push(
      `{id: ${node.id}, location: point({latitude: ${node.lat}, longitude: ${node.lon}})${str_node_tags}}`
    );
    if (this.nodes.length >= this.INSERTION_LIMIT) {
      await this.flushNodes();
    }
  }

  async handleWay(way) {
    this.spinner.load('ways');

    for (let i = 0; i < way.refs.length - 1; i++) {
      const sourceNode = way.refs[i];
      const targetNode = way.refs[i + 1];

      this.ways.push({
        node1: sourceNode,
        node2: targetNode,
        way_id: way.id,
      });
    }
  }

  async flushNodes() {
    if (this.nodes.length == 0) return;
    await this.server.query(
      `CALL apoc.create.nodes(['POINT'], [${this.nodes.join(',')}])`
    );
    this.nodes = [];
  }

  async flushWays() {
    if (this.ways.length == 0) return;

    const query = `
UNWIND $relationships AS r
MATCH (from:POINT {id: r.node1}), (to:POINT {id: r.node2})
CALL apoc.create.relationship(from, 'WAY', {way_id: r.way_id}, to) YIELD rel
RETURN count(rel) as count
`;

    await this.server.query(query, {
      relationships: this.ways,
    });

    this.ways = [];
  }

  async flushAll() {
    await this.flushNodes();
    await this.flushWays();
  }
}

export default Nqo4jQueryBuilder;

import SurrealdbConnection from './SurrealdbConnection.js';

export default class SurrealdbQueryBuilder {
  nodes = [];
  ways = [];
  relations = [];

  constructor(INSERTION_LIMIT, spinner) {
    this.server = null;
    this.INSERTION_LIMIT = INSERTION_LIMIT;
    this.spinner = spinner;
  }

  async init(args) {
    this.server = new SurrealdbConnection(args);
    await this.server.connect();
  }

  async close() {
    await this.server.disconnect();
  }

  async handleNode(node) {
    this.spinner.load('nodes');

    this.nodes.push({
      ...node.tags,
      id: node.id,
      location: {
        type: 'Point',
        coordinates: [node.lon, node.lat],
      },
      ...(node?.tags?.location ? { location_tag: node.tags.location } : null),
    });

    if (this.nodes.length >= this.INSERTION_LIMIT) {
      await this.flushNodes();
    }
  }

  async handleWay(way) {
    this.spinner.load('ways');

    this.ways.push({
      id: way.id,
      ...way.tags,
    });

    if (way.refs) {
      for (let i = 0; i < way.refs.length; i++) {
        let way_id = way.id;
        let node_id = way.refs[i];
        this.relations.push(`('ways:${way_id}', 'nodes:${node_id}', ${i})`);
      }
    }

    if (this.ways.length >= this.INSERTION_LIMIT) {
      await this.flushWays();
    }

    if (this.relations.length >= 6000) {
      await this.flushRelations();
    }
  }

  async flushNodes() {
    if (this.nodes.length == 0) return;
    this.spinner.load('nodes');
    await this.server.insert('nodes', this.nodes);
    this.nodes = [];
  }

  async flushWays() {
    if (this.ways.length == 0) return;
    this.spinner.load('ways');
    await this.server.insert('ways', this.ways);
    this.ways = [];
  }

  async flushRelations() {
    if (this.relations.length == 0) return;
    this.spinner.load('relations');

    let values = this.relations.join(',');
    await this.server.query(
      `INSERT INTO relations (way_id, node_id, sequence_id) VALUES ${values};`
    );
    // await this.server.query(values);

    this.relations = [];
  }

  async flushAll() {
    await this.flushNodes();
    await this.flushWays();
    await this.flushRelations();
  }
}

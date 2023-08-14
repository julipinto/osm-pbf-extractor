import MongodbConnection from './MongodbConnection.js';

class MongodbQueryBuilder {
  nodes = [];
  ways = [];
  relations = [];

  constructor(INSERTION_LIMIT, spinner) {
    this.server = null;
    this.INSERTION_LIMIT = INSERTION_LIMIT;
    this.spinner = spinner;
  }

  async init(args) {
    this.server = new MongodbConnection(args);
    await this.server.connect();
  }

  async close() {
    await this.server.disconnect();
  }

  // #sanitize_value(str) {
  //   let s = str.replaceAll(`\\`, `\\\\"`).replaceAll(`'`, `\\'`);

  //   // return s.includes(':') || s.includes(' ') ? '`' + s + '`' : "'" + s + "'";
  //   return "'" + s + "'";
  // }

  // #sanitize_key(str) {
  //   return str.includes(':') || str.includes(' ') ? '`' + str + '`' : str;
  // }

  /////////////////////////////////////////////////////////

  async handleNode(node) {
    this.spinner.load('nodes');
    this.nodes.push({
      // node_id: node.node_id,
      _id: node.node_id,
      location: {
        type: 'Point',
        coordinates: [node.lon, node.lat],
      },
      ...node.tags,
    });

    if (this.nodes.length >= this.INSERTION_LIMIT) {
      await this.flushNodes();
    }
  }

  async handleWay(way) {
    this.spinner.load('ways');

    this.ways.push({
      _id: way.id,
      // way_id: way.way_id,
      ...way.tags,
    });

    if (this.ways.length >= this.INSERTION_LIMIT) {
      await this.flushWays();
    }

    if (way.refs) {
      for (let i = 0; i < way.refs.length; i++) {
        this.relations.push({
          _id: way.id + '-' + way.refs[i] + '-' + i,
          way_id: way.id,
          node_id: way.refs[i],
          sequence_id: i,
        });
      }
    }

    if (this.relations.length >= this.INSERTION_LIMIT) {
      await this.flushRelations();
    }
  }

  async flushNodes() {
    if (this.nodes.length === 0) return;

    await this.server.nodes_collection().insertMany(this.nodes);
    this.nodes = [];
  }

  async flushWays() {
    if (this.ways.length === 0) return;

    await this.server.ways_collection().insertMany(this.ways);
    this.ways = [];
  }

  async flushRelations() {
    if (this.relations.length === 0) return;

    await this.server.relations_collection().insertMany(this.relations);
    this.relations = [];
  }

  async flushAll() {
    await this.flushNodes();
    await this.flushWays();
    await this.flushRelations();
  }
}

export default MongodbQueryBuilder;

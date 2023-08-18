import MarklogicConnection from './MarklogicConnection.js';

class MarklogicQueryBuilder {
  nodes = [];
  ways = [];
  relations = [];

  constructor(INSERTION_LIMIT, spinner) {
    this.server = null;
    this.INSERTION_LIMIT = INSERTION_LIMIT;
    this.spinner = spinner;
  }

  async init(args) {
    this.server = new MarklogicConnection(args);
    await this.server.connect();
  }

  async close() {
    await this.server.disconnect();
  }

  async handleNode(node) {
    this.spinner.load('nodes');
    this.nodes.push({
      uri: `/nodes/${node.node_id}.json`, // Substitua conforme sua estrutura de URIs
      content: {
        location: {
          type: 'Point',
          coordinates: [node.lat, node.lon],
        },
        ...node.tags,
      },
    });

    if (this.nodes.length >= this.INSERTION_LIMIT) {
      await this.flushNodes();
    }
  }

  async handleWay(way) {
    this.spinner.load('ways');

    this.ways.push({
      uri: `/ways/${way.id}.json`, // Substitua conforme sua estrutura de URIs
      content: {
        ...way.tags,
      },
    });

    if (this.ways.length >= this.INSERTION_LIMIT) {
      await this.flushWays();
    }

    if (way.refs) {
      for (let i = 0; i < way.refs.length; i++) {
        this.relations.push({
          uri: `/relations/${way.id}-${way.refs[i]}-${i}.json`, // Substitua conforme sua estrutura de URIs
          content: {
            way_id: way.id,
            node_id: way.refs[i],
            sequence_id: i,
          },
        });
      }
    }

    if (this.relations.length >= this.INSERTION_LIMIT) {
      await this.flushRelations();
    }
  }

  async flushNodes() {
    if (this.nodes.length === 0) return;

    await this.conn.documents.write(this.nodes);
    this.nodes = [];
  }

  async flushWays() {
    if (this.ways.length === 0) return;

    await this.conn.documents.write(this.ways);
    this.ways = [];
  }

  async flushRelations() {
    if (this.relations.length === 0) return;

    await this.conn.documents.write(this.relations);
    this.relations = [];
  }

  async flushAll() {
    await this.flushNodes();
    await this.flushWays();
    await this.flushRelations();
  }
}

export default MarklogicQueryBuilder;

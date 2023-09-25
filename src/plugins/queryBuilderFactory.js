import MySQLQueryBuilder from './mysql/MysqlQueryBuilder.js';
import PostgresQueryBuilder from './postgres/PostgresQueryBuilder.js';
import Neo4jQueryBuilder from './neo4j/Neo4jQueryBuilder.js';
import MongodbQueryBuilder from './mongodb/MongodbQueryBuilder.js';
import SurrealdbQueryBuilder from './surrealdb/SurrealdbQueryBuilder.js';
// import MarklogicQueryBuilder from './marklogic/MarklogicQueryBuilder.js';

function queryBuilderFactory(dbmanager, INSERTION_LIMIT, spinner_logger) {
  switch (dbmanager) {
    case 'postgres':
      return new PostgresQueryBuilder(INSERTION_LIMIT, spinner_logger);
    case 'neo4j':
      return new Neo4jQueryBuilder(INSERTION_LIMIT, spinner_logger);
    case 'mongodb':
      return new MongodbQueryBuilder(INSERTION_LIMIT, spinner_logger);
    case 'surrealdb':
      return new SurrealdbQueryBuilder(INSERTION_LIMIT, spinner_logger);
    case 'marklogic':
      // return new MarklogicQueryBuilder(INSERTION_LIMIT, spinner_logger);
      throw new Error("I'm sorry, MarkLogic is not good to go yet");
    default:
      return new MySQLQueryBuilder(INSERTION_LIMIT, spinner_logger);
  }
}

export default queryBuilderFactory;

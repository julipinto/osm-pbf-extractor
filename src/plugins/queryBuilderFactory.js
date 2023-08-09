import MySQLQueryBuilder from './mysql/MysqlQueryBuilder.js';
import PostgresQueryBuilder from './postgres/PostgresQueryBuilder.js';
import Neo4jQueryBuilder from './neo4j/Neo4jQueryBuilder.js';

function queryBuilderFactory(dbmanager, INSERTION_LIMIT, spinner_logger) {
  switch (dbmanager) {
    case 'postgres':
      return new PostgresQueryBuilder(INSERTION_LIMIT, spinner_logger);
    case 'neo4j':
      return new Neo4jQueryBuilder(INSERTION_LIMIT, spinner_logger);
    default:
      return new MySQLQueryBuilder(INSERTION_LIMIT, spinner_logger);
  }
}

export default queryBuilderFactory;

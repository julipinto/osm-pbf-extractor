import MySQLQueryBuilder from "./mysql/MysqlQueryBuilder.js";
import PostgisQueryBuilder from "./postgis/PostgisQueryBuilder.js";

function queryBuilderFactory(dbmanager, INSERTION_LIMIT, spinner_logger) {
  switch (dbmanager) {
    case 'postgis':
      return new PostgisQueryBuilder(INSERTION_LIMIT, spinner_logger);
    default:
      return  new MySQLQueryBuilder(INSERTION_LIMIT, spinner_logger);
      
  }
}

export default queryBuilderFactory;
import { Transform } from 'node:stream';
import { resolve } from 'node:path';
import { OSMTransform } from 'osm-pbf-parser-node';
import { createReadStream, createWriteStream } from 'node:fs';
import MysqlPlugin from './plugins/mysql.js';
import QueryBuilder from './utils/querybuilder.js';
import DBSpinner from './utils/dbspinner.js';

console.time('database load');
const INSERTION_LIMIT = 200;

const args = {
  file: 'bahia.osm.pbf',
  database: 'bahia',
  user: 'root',
  password: '1234',
  dbmanager: 'mysql',
  path: 'C:\\Users\\nana-\\Documents\\uefs\\TCC\\bases de dados\\bahia.osm.pbf',
};

const mysql = new MysqlPlugin(args);

// (24052682, 559048564, 3),

async function run() {
  await mysql.connect();

  const console_spinner = new DBSpinner();

  const path = resolve(args.path);
  const readStream = createReadStream(path);
  const qb = new QueryBuilder(mysql, INSERTION_LIMIT, console_spinner);

  const consume = new Transform.PassThrough({
    objectMode: true,
    transform: async (items, enc, next) => {
      for (let item of items) {
        // Insert Nodes
        if (item.type == 'node') {
          await qb.insertNode(item.id, item.lat, item.lon);
          // Iterate through tags if has any
          if (item.tags) {
            for (let [key, value] of Object.entries(item.tags)) {
              await qb.insertNodeTag(item.id, key, value);
            }
          }
        }

        // Insert Ways
        else if (item.type == 'way') {
          await qb.insertWay(item.id);
          // Iterate through tags if has any
          if (item.tags) {
            for (let [key, value] of Object.entries(item.tags)) {
              await qb.insertWayTag(item.id, key, value);
            }
          }
          // Iterate through refs if has any
          if (item.refs) {
            for (let i = 0; i < item.refs.length; i++) {
              await qb.insertWayNode(item.id, item.refs[i], i);
            }
          }
        }
      }

      await qb.flushAll();
      next();
    },
  });

  readStream
    .pipe(
      new OSMTransform({
        writeRaw: false,
        withTags: true,
        withInfos: true,
      })
    )
    .pipe(consume)
    .on('finish', () => {
      console_spinner.spinner.succeed('Database load finished');
      console.timeEnd('database load');
      mysql.disconnect();
    })
    .on('error', (err) => {
      console_spinner.spinner.fail('Database load failed');
      console.timeEnd('database load');
      console.log(err);
    });
}

run();

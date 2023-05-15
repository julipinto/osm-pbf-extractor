import { Transform } from 'node:stream';
import { resolve } from 'node:path';
import { OSMTransform } from 'osm-pbf-parser-node';
import { createReadStream } from 'node:fs';
import QueryBuilder from './plugins/mysql/MysqlQueryBuilder.js';
import DBSpinner from './utils/dbspinner.js';

console.time('database load');
const INSERTION_LIMIT = 500;

const args = {
  file: 'bahia.osm.pbf',
  database: 'bahia',
  user: 'root',
  password: '1234',
  dbmanager: 'mysql',
  path: 'C:\\Users\\nana-\\Documents\\uefs\\TCC\\bases de dados\\bahia.osm.pbf',
};

async function run() {
  const console_spinner = new DBSpinner();

  const path = resolve(args.path);
  const readStream = createReadStream(path);

  const qb = new QueryBuilder(INSERTION_LIMIT, console_spinner);
  await qb.init(args);

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
      qb.close();
    })
    .on('error', (err) => {
      console_spinner.spinner.fail('Database load failed');
      console.timeEnd('database load');
      console.log(err);
      qb.close();
    });
}

run();

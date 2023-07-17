#!/usr/bin/env node

import { Transform } from 'node:stream';
import { resolve, parse } from 'node:path';
import { OSMTransform } from 'osm-pbf-parser-node';
import { createReadStream } from 'node:fs';
import QueryBuilder from './plugins/mysql/MysqlQueryBuilder.js';
import LoggerDBSpinner from './utils/dbspinner.js';
import { args } from './utils/argparser.js';

console.time('database load');
const INSERTION_LIMIT = args.insertion_limit ?? 500;

async function run() {
  const spinner_logger = new LoggerDBSpinner();

  const path = resolve(args.input_file);

  const readStream = createReadStream(path);

  const qb = new QueryBuilder(INSERTION_LIMIT, spinner_logger);

  await qb.init(args);

  console.log(`Dumping ${parse(path).base} into database. It may take a while...`)

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
      spinner_logger.spinner.succeed('Database load finished');
      console.timeEnd('database load');
      qb.close();
    })
    .on('error', (err) => {
      spinner_logger.spinner.fail('Database load failed');
      console.timeEnd('database load');
      console.log(err);
      qb.close();
    });
}

run();

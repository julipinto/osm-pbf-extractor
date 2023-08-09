#!/usr/bin/env node

import { Transform } from 'node:stream';
import { resolve, parse } from 'node:path';
import { OSMTransform } from 'osm-pbf-parser-node';
import { createReadStream } from 'node:fs';
import queryBuilderFactory from './plugins/queryBuilderFactory.js';
import LoggerDBSpinner from './utils/dbspinner.js';
import { args } from './utils/argparser.js';
import { paint } from './utils/conscolor.js';

// (dbmanager, INSERTION_LIMIT, spinner_logger) {

console.time('database load');

const INSERTION_LIMIT = args.insertion_limit;

async function run() {
  const spinner_logger = new LoggerDBSpinner();

  const path = resolve(args.input_file);

  const readStream = createReadStream(path);

  const qb = queryBuilderFactory(
    args.dbmanager,
    INSERTION_LIMIT,
    spinner_logger
  );

  await qb.init(args);

  console.log(
    `Dumping ${paint(
      parse(path).base,
      'blue'
    )} into database. It may take a while...`
  );
  let count = 0;

  const consume = new Transform.PassThrough({
    objectMode: true,
    transform: async (items, enc, next) => {
      const tik = performance.now();
      for (let item of items) {
        // Insert Nodes
        if (item.type === 'node') {
          await qb.handleNode(item);
        }

        // Insert Ways
        if (item.type === 'way') {
          await qb.handleWay(item);
        }
      }

      count += 1;
      console.log(
        `${count}) ${items.length} items inserted ${items[0].type} ${
          performance.now() - tik
        }\n`
      );

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
    .on('finish', async () => {
      // await qb.finishQuery();
      await qb.close();
      spinner_logger.spinner.succeed('Database load finished');
      console.timeEnd('database load');
    })
    .on('error', async (err) => {
      await qb.close();
      spinner_logger.spinner.fail('Database load failed');
      console.timeEnd('database load');
      console.log(err);
    });
}

run();

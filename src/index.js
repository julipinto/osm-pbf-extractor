#!/usr/bin/env node

import { Transform } from 'node:stream';
import { resolve, parse } from 'node:path';
import { OSMTransform } from 'osm-pbf-parser-node';
import { createReadStream } from 'node:fs';
import queryBuilderFactory from './plugins/queryBuilderFactory.js';
import LoggerDBSpinner from './utils/dbspinner.js';
import { args } from './utils/argparser.js';
import { paint } from './utils/conscolor.js';

// console.time('database load');

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

  const filename = parse(path).base;
  console.log(
    `Dumping ${paint(filename, 'blue')} into database. It may take a while...`
  );

  const start = performance.now();

  const consume = new Transform.PassThrough({
    objectMode: true,
    transform: async (items, enc, next) => {
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
      await qb.close();
      spinner_logger.spinner.succeed('Database load finished');
      // console.timeEnd('database load');
      const end = performance.now();
      console.log(`Time elapsed: ${Math.round(end - start)}ms`);
    })
    .on('error', async (err) => {
      await qb.close();
      spinner_logger.spinner.fail('Database load failed');
      const end = performance.now();
      console.error(err);
      console.log(
        `Time elapsed ${paint(filename, 'blue')}: ${Math.round(end - start)}ms`
      );
    });
}

run();

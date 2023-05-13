import { Transform } from 'node:stream';
import { createOSMStream, OSMTransform } from 'osm-pbf-parser-node';
import { createReadStream } from 'node:fs';

var path =
  'C:\\Users\\nana-\\Documents\\uefs\\TCC\\bases de dados\\brazil.osm.pbf';

let n = 0,
  w = 0,
  r = 0;

function header(item) {
  let seqno = item.osmosis_replication_sequence_number,
    url = item.osmosis_replication_base_url,
    tms = item.osmosis_replication_timestamp;
  let str = new Date(tms * 1000).toUTCString().substring(5);
  console.log(`header: seqno: ${seqno}, timestamp: ${str}, url: ${url}`);
}

function count(item) {
  if (item.type == 'node') ++n;
  else if (item.type == 'way') ++w;
  else if (item.type == 'relation') ++r;
  else if (item.bbox) header(item);
  else console.log(item);
}

const consume = new Transform.PassThrough({
  objectMode: true,
  transform: (items, enc, next) => {
    for (let item of items) count(item);
    next();
  },
});

console.time('read');
createReadStream(path)
  .pipe(new OSMTransform({ writeRaw: false }))
  .pipe(consume)
  .on('finish', () => {
    console.timeEnd('read');
    console.log('EOD');
    console.log('nodes:', n);
    console.log('ways:', w);
    console.log('relations:', r);
  });

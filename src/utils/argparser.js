import { parseArgs } from 'node:util';

const args = ['--file'];
const options = {
  file: {
    type: 'string',
  },
  database: {
    type: 'string',
  },
  user: {
    type: 'string',
  },
  password: {
    type: 'string',
  },
  dbmanager: {
    type: 'string',
  },
};

// const { values, positionals } = parseArgs({ args, options });
const parse = parseArgs({ args, options });
console.log(values, positionals);

export { parse };

// Measure-Command { osmosis --read-pbf bahia.osm.pbf
//--write - apidb dbType = "mysql"
//database = "bahia" user = "root" password = "1234" validateSchemaVersion = no }

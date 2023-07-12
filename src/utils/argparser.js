import { parseArgs } from 'node:util';
import { exit } from 'node:process';

const options = {
  input_file: {
    type: 'string',
    short: 'i',
  },
  database: {
    type: 'string',
    short: 'd',
  },
  user: {
    type: 'string',
    short: 'u',
  },
  password: {
    type: 'string',
    short: 'p',
  },
  dbmanager: {
    type: 'string',
    short: 'm',
  },
  host: {
    type: 'string',
    short: 'h',
  },
  port: {
    type: 'string',
    short: 'o',
  },
  insertion_limit: {
    type: 'string',
    short: 'l',
  },
  populate: {
    type: 'boolean',
    short: 'P',
  },
  help: {
    type: 'boolean',
  },
};

const { values } = parseArgs({ options });



let requiredArgsMissing = [];
['input_file', 'database', 'user', 'password'].forEach((key) => {
  if (!values[key]) {
    requiredArgsMissing.push(key);
  }
});

if (values.help || Object.keys(values).length === 0) {
console.log(`
Welcome to PBF Parser!

Usage
Required arguments:
-i, --input_file\t\t[.pbf] file to be parsed path
-d, --database\t\t\tDatabase name
-u, --user\t\t\tDatabase user
-p, --password\t\t\tDatabase password

Optional arguments:
-m, --dbmanager\t\t\tDatabase manager (default: mysql)
-l, --insertion_limit\t\tNumber of rows to be inserted at once (default: 500)
-h, --host\t\t\tDatabase host (default: localhost)
-o, --port\t\t\tDatabase port (default: 3306)

⚠ Be careful with the optional following argument:
-P, --populate\t\t\t⚠ Populate database with default schema (default: false) 
⚠ Warning: this command will drop all tables to structure a database with the default schema

exemples:
  pbfx --input_file {path_to_file} --database {db name} --user {user} --password {password} --dbmanager {dbmanager} --insertion_limit {limit} --host {host} --port {port}

  pbfx -i {path_to_file} -d {db name} -u {user} -p {password} -m {dbmanager} -l {limit} -h {host} -o {port}
`);
  exit(0);
}

if (requiredArgsMissing.length > 0) {
  throw new Error(
    `Missing required arguments: ${requiredArgsMissing.join(', ')}`
  );
}

if (values.dbmanager && ['mysql'].find((dbm) => dbm == values.dbmanager)) {
  throw new Error(`Unsupported dbmanager: ${values.dbmanager}`);
}

if (values.insertion_limit) {
  if (isNaN(values.insertion_limit))
    throw new Error(
      `Invalid insertion_limit: ${values.insertion_limit}, must be a number`
    );

  if (parseInt(values.insertion_limit) < 1)
    throw new Error(
      `Invalid insertion_limit: ${values.insertion_limit}, must be greater than 0`
    );
}

const args = {
  ...values,
  ...(values.insertion_limit || {
    insertion_limit: parseInt(values.insertion_limit),
  }),
};

export { args };

// Measure-Command { osmosis --read-pbf bahia.osm.pbf
//--write - apidb dbType = "mysql"
//database = "bahia" user = "root" password = "1234" validateSchemaVersion = no }

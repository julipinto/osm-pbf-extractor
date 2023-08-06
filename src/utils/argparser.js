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
  hostname: {
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
    short: 'A',
  },
  connection_timeout: {
    type: 'string',
    short: 't',
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

Usage:
Required arguments:
  -i, --input_file <input-file>      Path to the input PBF file.
  -d, --database <database>          Database name.
  -u, --user <user>                  Database user.
  -p, --password <password>          Database password.

Optional arguments:
  -m, --dbmanager <manager>          Database manager. Valid values: mysql | postgres | neo4j (default: mysql).
  -l, --insertion_limit <limit>      Number of rows to be inserted at once (default: Insert what the chunk size of the pipeline provide).
  -h, --hostname <host>              Database host (default: localhost).
  -o, --port <port>                  Database port (default value of each database chosen, ex: MySQL: 3306)
  -t, --connection_timeout <timeout> Timeout to try to connect with the database in milliseconds (default: 60000ms [one minute]).

⚠ Be careful with the following optional argument:
  -A, --populate                     ⚠ Populate the database with the default schema (default: false).
⚠ Warning: This command will drop all tables to structure a database with the default schema.

Examples:
  pbfx --input_file <path_to_file> --database <db_name> --user <user> --password <password> --dbmanager <dbmanager> --insertion_limit <limit> --hostname <host> --port <port>

  pbfx -i <path_to_file> -d <db_name> -u <user> -p <password> -m <dbmanager> -l <limit> -h <host> -o <port>
`);
  exit(0);
}

if (requiredArgsMissing.length > 0) {
  throw new Error(
    `Missing required arguments: ${requiredArgsMissing.join(', ')}`
  );
}

if (
  values.dbmanager &&
  !['mysql', 'postgres', 'neo4j'].includes(values.dbmanager)
) {
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

let insertion_limit = Infinity;
if (values.insertion_limit) {
  insertion_limit = parseInt(values.insertion_limit);
}

const args = {
  ...values,
  ...(insertion_limit && { insertion_limit }),
};

export { args };

import { parseArgs } from 'node:util';
import { exit } from 'node:process';

const options = {
  file: {
    type: 'string',
    short: 'f',
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
  insertion_limit: {
    type: 'string',
    short: 'l',
  },
};

const { values } = parseArgs({ options });

let requiredArgsMissing = [];
['file', 'database', 'user', 'password'].forEach((key) => {
  if (!values[key]) {
    requiredArgsMissing.push(key);
  }
});

if (
  requiredArgsMissing.length === 4 &&
  !values.dbmanager &&
  !values.insertion_limit
) {
  console.log(`
Welcome to PBF Parser!

Usage
Required arguments:
--file, -f\t\t\t[.pbf] file to be parsed path
--database, -d\t\t\tDatabase name
--user, -u\t\t\tDatabase user
--password, -u\t\t\tDatabase password

Optional arguments:
--dbmanager, -dbm\t\tDatabase manager (default: mysql)
--insertion_limit, -il\t\tumber of rows to be inserted at once (default: 500)

example: 
  pbfx --file {path_to_file} --database {db name} --user {user} --password {password} --dbmanager {dbmanager}
  pbfx -f {path_to_file} -d {db name} -u {user} -p {password} -m {dbmanager} -l {limit}
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

  if (values.insertion_limit < 1)
    throw new Error(
      `Invalid insertion_limit: ${values.insertion_limit}, must be greater than 0`
    );
}

const args = {
  ...values,
  ...(values.insertion_limit ?? {
    insertion_limit: Number(values.insertion_limit),
  }),
};

export { args };

// Measure-Command { osmosis --read-pbf bahia.osm.pbf
//--write - apidb dbType = "mysql"
//database = "bahia" user = "root" password = "1234" validateSchemaVersion = no }

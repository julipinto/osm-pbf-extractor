// import SurrealDB from 'surrealdb.js';
// import ora from 'ora';

// async function teste() {
//   let hostname = 'localhost';
//   let port = 8000;
//   const db = new SurrealDB();
//   const url = `http://${hostname}:${port}/rpc`;
//   const config = { auth: { user: 'root', pass: 'root' } };
//   await db.connect(url, config);
//   await db.use({ ns: 'root', db: 'map' });

// const r = await db.query(`
//   LET $a = (SELECT location FROM nodes:7410560799)[0].location;
//   LET $b = (SELECT location FROM nodes:4662482749)[0].location;
//   RETURN geo::distance($a, $b)
// `);

// const r = await db.query(`
//   LET $source = (SELECT location FROM nodes:7410560799)[0].location;
//   COUNT(SELECT id FROM nodes WHERE geo::distance(location, $source) <= 50);
// `);

// windowRange: ({ node1, node2 }) =>
//   'SELECT n.node_id, n.location FROM nodes n ' +
//   `WHERE ST_X(n.location) >= LEAST((SELECT ST_X(location) FROM nodes WHERE node_id = ${node1}), (SELECT ST_X(location) FROM nodes WHERE node_id = ${node2})) ` +
//   `AND ST_X(n.location) <= GREATEST((SELECT ST_X(location) FROM nodes WHERE node_id = ${node1}), (SELECT ST_X(location) FROM nodes WHERE node_id = ${node2})) ` +
//   `AND ST_Y(n.location) >= LEAST((SELECT ST_Y(location) FROM nodes WHERE node_id = ${node1}), (SELECT ST_Y(location) FROM nodes WHERE node_id = ${node2})) ` +
//   `AND ST_Y(n.location) <= GREATEST((SELECT ST_Y(location) FROM nodes WHERE node_id = ${node1}), (SELECT ST_Y(location) FROM nodes WHERE node_id = ${node2})) ` +
//   `AND n.node_id != ${node1} AND n.node_id != ${node2};`,

// let radiusRangeCount = ({ node1, node2 }) => `
//   LET $x1 = (SELECT location FROM nodes:${node1})[0].location.coordinates[0];
//   LET $y1 = (SELECT location FROM nodes:${node1})[0].location.coordinates[1];
//   LET $x2 = (SELECT location FROM nodes:${node2})[0].location.coordinates[0];
//   LET $y2 = (SELECT location FROM nodes:${node2})[0].location.coordinates[1];
//   SELECT id FROM nodes
//   WHERE
//     location.coordinates[0] >= math::min([$x1, $x2]) AND
//     location.coordinates[0] <= math::max([$x1, $x2]) AND
//     location.coordinates[1] >= math::min([$y1, $y2]) AND
//     location.coordinates[1] <= math::max([$y1, $y2]) AND
//     ${node1} != ${node2};
// `;
// let radiusRangeCount = (key, value, k) => `
//   LET $d1 = (SELECT id, location FROM nodes WHERE ${key} = ${value});
//   LET $d2 = (SELECT id, location FROM nodes WHERE ${key} = ${value});
//   RETURN $d1 * $d2
// `;

// let r = await db.query(radiusRangeCount('power', 'tower', 2));
// console.log(r);
// console.log(r[1].result);

// let query = `
//   RELATE nodes:7410560799->way_node->nodes:4662482749 CONTENT {way_id: ways:387342861};
//   RELATE nodes:4662482749->way_node->nodes:7410554270 CONTENT {way_id: ways:387342861};
// `;
// ORDER BY geo::distance(location, target.location) ASC;
// WHERE id != target.id

//   let radiusRangeCount = (key, value) => `
//     SELECT id, location,
//     (SELECT id, location FROM nodes WHERE ${key} = ${value}) AS target
//     FROM (SELECT id, location FROM nodes WHERE ${key} = ${value})
//     SPLIT target
//     WHERE id != target.id
//     SORT BY geo::distance(id, target.id) ASC
//     LIMIT ${k};
//   `;

//   // let query = `SELECT * FROM ways`;
//   let result = await db.query(radiusRangeCount('power', 'tower'));
//   // let result = await db.query('SELECT * FROM nodes LIMIT 1');
//   console.log(result);
//   console.log(JSON.stringify(result));

//   await db.close();
// }

// await teste();

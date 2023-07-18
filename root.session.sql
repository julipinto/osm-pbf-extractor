UPDATE ways
SET way_line = ST_MultiLineString(
  (SELECT location FROM nodes WHERE node_id = way_nodes.node_id AND sequence_index = 1),
  (SELECT location FROM nodes WHERE node_id = way_nodes.node_id AND sequence_index = way_nodes.sequence_index - 1)
)
FROM way_nodes
WHERE way_nodes.way_id = ways.way_id
GROUP BY way_id;
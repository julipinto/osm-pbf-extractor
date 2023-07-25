-- Criação da extensão PostGIS no banco de dados
CREATE EXTENSION IF NOT EXISTS postgis;

-- Criação das tabelas
CREATE TABLE nodes (
  node_id bigint NOT NULL,
  location geometry(Point, 4326) NOT NULL,
  PRIMARY KEY (node_id)
);

CREATE TABLE node_tags (
  node_id bigint NOT NULL,
  tag_key varchar(255) NOT NULL,
  tag_value varchar(255) NOT NULL,
  PRIMARY KEY (node_id, tag_key),
  CONSTRAINT fk_node_tags_nodes FOREIGN KEY (node_id) REFERENCES nodes (node_id)
);

CREATE TABLE ways (
  way_id bigint NOT NULL,
  way_line geometry(LineString, 4326),
  PRIMARY KEY (way_id)
);

CREATE TABLE way_tags (
  way_id bigint NOT NULL,
  tag_key varchar(255) NOT NULL,
  tag_value varchar(255) NOT NULL,
  PRIMARY KEY (way_id, tag_key),
  CONSTRAINT fk_way_tags_ways FOREIGN KEY (way_id) REFERENCES ways (way_id)
);

CREATE TABLE way_nodes (
  way_id bigint NOT NULL,
  node_id bigint NOT NULL,
  sequence_index int NOT NULL,
  PRIMARY KEY (way_id, sequence_index),
  CONSTRAINT fk_way_nodes_ways FOREIGN KEY (way_id) REFERENCES ways (way_id),
  CONSTRAINT fk_way_nodes_nodes FOREIGN KEY (node_id) REFERENCES nodes (node_id)
);
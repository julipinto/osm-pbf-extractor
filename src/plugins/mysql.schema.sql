--  3857: WGS84 Pseudo-Mercator
--  4326: WGS84

DROP TABLE IF EXISTS bahia.nodes;
CREATE TABLE bahia.nodes (
  `node_id` bigint(64) NOT NULL,
  `position` POINT NOT NULL SRID 4326,
  PRIMARY KEY (id),
  SPATIAL INDEX(`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
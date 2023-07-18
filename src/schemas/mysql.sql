DROP DATABASE map;

CREATE DATABASE IF NOT EXISTS map
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE map;

CREATE TABLE `map`.`nodes` (
  `node_id` bigint(64) NOT NULL,
  `location` POINT NOT NULL SRID 4326,
  PRIMARY KEY (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `map`.`node_tags` (
  `node_id` bigint(64) NOT NULL,
  `tag_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL default '',
  `tag_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL default '',
  PRIMARY KEY (`node_id`, `tag_key`),
  CONSTRAINT `node_tags_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `map`.`ways` (
  `way_id` bigint(64) NOT NULL,
  `way_line` LINESTRING DEFAULT NULL SRID 4326,
  PRIMARY KEY  (`way_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `map`.`way_tags` (
  `way_id` bigint(64) NOT NULL,
  `tag_key` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL default '',
  `tag_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL default '',
  PRIMARY KEY  (`way_id`,`tag_key`),
  CONSTRAINT `way_tags_ibfk_1` FOREIGN KEY (`way_id`) REFERENCES `ways` (`way_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `map`.`way_nodes` (
  `way_id` bigint(64) NOT NULL,
  `node_id` bigint(64) NOT NULL,
  `sequence_index` int(11) NOT NULL,
  PRIMARY KEY  (`way_id`,`sequence_index`),
  CONSTRAINT `way_nodes_ibfk_1` FOREIGN KEY (`way_id`) REFERENCES `ways` (`way_id`),
  CONSTRAINT `way_nodes_ibfk_2` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
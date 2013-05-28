/*
 * postgres-insights
 * https://github.com/markselby/node-postgres-insights
 *
 * Copyright (c) 2013 Mark Selby
 * Licensed under the MIT license.
 */

'use strict';

var Sql = require('db-query');

exports.columns = function columns(table, database, schema) {
  var q = new Sql();
  q.select('table_name, column_name, ordinal_position, column_default, is_nullable, data_type, character_maximum_length');
  q.from('INFORMATION_SCHEMA.COLUMNS');

  q.param(schema || 'public');
  q.where('table_schema = ' + q.paramNo());

  if (database) {
    q.param(database); // neo_production
    q.where('table_catalog = '  + q.paramNo());
  }

  if (table) {
    q.param(table);
    q.where("table_name = " + q.paramNo());
    q.order('table_name');
  }

  q.order('ordinal_position');
  q.limit(null);
  return q;
};

exports.tables = function tables(database, schema) {
  var q = new Sql();
  q.select('* FROM (SELECT table_name, count(*) AS columns');
  q.select('(SELECT reltuples::bigint AS estimate FROM pg_class where relname=table_name) AS rows');
  q.select('(SELECT sum(avg_width) AS average_row_size FROM pg_stats WHERE tablename=table_name) AS average_row_size');
  q.select('pg_relation_size(table_name) AS table_size');
  q.select('pg_indexes_size(table_name) AS index_size');
  q.select('pg_total_relation_size(table_name) AS total_size');

  q.from('INFORMATION_SCHEMA.COLUMNS');

  q.param(database || 'neo_production');
  q.where('table_catalog = '  + q.paramNo());

  q.param(schema || 'public');
  q.where('table_schema = ' + q.paramNo());

  q.group('table_name) AS tables');
  q.limit(undefined);
  return q;
};

exports.indexes = function indexes(table) {
  var q = new Sql();
  q.select("i.relname as name, array_to_string(array_agg(a.attname), ', ') as columns");
  q.from("pg_class t, pg_class i, pg_index ix, pg_attribute a");
  q.where("t.oid = ix.indrelid AND i.oid = ix.indexrelid AND a.attrelid = t.oid");
  q.param(table);
  q.where("a.attnum = ANY(ix.indkey) AND t.relkind = 'r' AND t.relname = " + q.paramNo());
  q.group('t.relname, i.relname');
  q.order('t.relname, i.relname');
  return q;
};

exports.indexStats = function indexStats() {
  var q = new Sql();
  q.select('s.schemaname AS "schema", s.relname AS "table", s.indexrelname AS "index", s.idx_scan AS scans');
  q.select('pg_relation_size(s.relid) AS table_size, pg_relation_size(s.indexrelid) AS "index_size"');
  q.from('pg_stat_user_indexes s');
  q.join('JOIN pg_index i on i.indexrelid=s.indexrelid');
  q.join("LEFT JOIN pg_constraint c ON i.indrelid = c.conrelid AND array_to_string(i.indkey, ' ') = array_to_string(c.conkey, ' ')");
  q.where('i.indisunique is false');
  q.where('pg_relation_size(s.relid) > 1000000');
  q.where('s.idx_scan < 100000');
  q.where('c.confrelid IS NULL');
  q.order('s.idx_scan asc, pg_relation_size(s.indexrelid) DESC');
  q.limit(null);
  return q;
};

exports.foreignKeys = function foreignKeys(table) {
  var q = new Sql();
  q.select('tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name')
    .from('information_schema.table_constraints AS tc')
    .join('JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name')
    .join('JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name')
    .where("constraint_type = 'FOREIGN KEY'")
    .limit(null);
  if (table) {
    q.param(table);
    q.where('table_name = ' + q.paramNo());
  }
  return q;
};

exports.randomRecord = function randomRecord(table) {
  var q = new Sql();
  q.select('*');
  q.from(table);
  q.param(table);
  q.offset('(random() * (SELECT reltuples::bigint AS estimate FROM pg_class where relname=$1)::int)');
  q.limit(1);
  return q;
};

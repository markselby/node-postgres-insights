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

  q.param(database || 'neo_production');
  q.where('table_catalog = '  + q.paramNo());

  q.param(table);
  q.where("table_name = " + q.paramNo());

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

exports.randomRecord = function randomRecord(table) {
  var q = new Sql();
  q.select('*');
  q.from(table);
  q.param(table);
  q.offset('(random() * (SELECT reltuples::bigint AS estimate FROM pg_class where relname=$1)::int)');
  q.limit(1);
  return q;
};

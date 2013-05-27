/*
 * postgres-insights
 * https://github.com/markselby/node-postgres-insights
 *
 * Copyright (c) 2013 Mark Selby
 * Licensed under the MIT license.
 */

'use strict';

var queries = require('./queries');
var dbPool = require('db-pool');

console.log(dbPool.connections());

var PostgresInsights = function PostgresInsights(app, env) {
  this.env = env || process.env.NODE_ENV || 'development';
  this.app = app || 'neo';           // App name as defined in your config/database.yml
  this.database = dbPool.databaseName(); // The actual database name for app/env in config/database.yml
  this.pool = dbPool.pool(this.env, this.app);
};

var p = PostgresInsights.prototype;

p.tables = function tables(schema) {
  var q = queries.tables(this.database, schema);
  return q;
};

p.columns = function tables(table, database, schema) {
  var q = queries.columns(table, database || this.database, schema);
  return q;
};

p.indexes = function tables(table, database, schema) {
  var q = queries.indexes(table, database || this.database, schema);
  return q;
};

p.randomRecord = function tables(table, database, schema) {
  var q = queries.randomRecord(table, database || this.database, schema);
  return q;
};

module.exports = PostgresInsights;

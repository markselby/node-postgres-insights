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

var PostgresInsights = function PostgresInsights(pool) {
  this.pool = pool || dbPool.pool(process.env.NODE_ENV || 'development');
};

var p = PostgresInsights.prototype;

p.tables = function tables(database, schema) {
  return queries.tables(database);
}

/*
 * postgres-insights
 * https://github.com/markselby/node-postgres-insights
 *
 * Copyright (c) 2013 Mark Selby
 * Licensed under the MIT license.
 */

'use strict';

var sql = require('db-query');

var PostgresInsights = function PostgresInsights (pool) {
  this.pool = pool;
}

var p = PostgresInsights.prototype;


'use strict';

// Requires
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var path = require('path');
var PluginError = require('plugin-error');
var through = require('through2');

module.exports = function(opts) {
	return through.obj(function(file, enc, cb) {
		// File is null - pass along
		if (file.isNull()) {
			return cb(null, file);
		}

		// File is stream - not supported
		if (file.isStream()) {
			return cb(
				new PluginError(
					'gulp-mongodb-data',
					'Streaming is not supported'
				)
			);
		}

		// Set default options
		opts = setDefaultOptions(opts);

		var content = String(file.contents);
		var json;

		try {
			json = JSON.parse(content);
		} catch (e) {
			return cb(
				new PluginError(
					'gulp-mongodb-data',
					'Problem parsing JSON file', {
						fileName: file.path,
						showStack: true
					}
				)
			);
		}

		// Only arrays of objects are supported
		if (!Array.isArray(json)) {
			return cb(
				new PluginError(
					'gulp-mongodb-data',
					'JSON is not an array', {
						fileName: file.path,
						showStack: true
					}
				)
			);
		}

		MongoClient.connect(opts.mongoUrl, function(err, db) {
			if (err) {
				return cb(new PluginError('gulp-mongodb-data', err, {
					showStack: true
				}));
			}

			var collectionName =  opts.collectionName ||
				path.basename(file.path, path.extname(file.path));
			var coll = db.collection(collectionName);

			// Run methods synchronous
			async.series([
				// Drop collection if option is set and collection exists
				function(cb) {
					if (opts.dropCollection) {
						db.listCollections({name: collectionName})
							.toArray(function(err, items) {
								if (err) {
									return cb(err);
								}

								if (items.length) {
									coll.drop(function(err) {
										cb(err);
									});
								} else {
									cb();
								}
							});
					} else {
						cb();
					}
				},
				// Insert dato into collection
				function(cb) {
					coll.insertMany(json, function(err) {
						cb(err);
					});
				}
			], function(err) {
				db.close();

				if (err) {
					return cb(new PluginError('gulp-mongodb-data', err, {
						showStack: true
					}));
				}

				// Pass on
				cb(null, file);
			});
		});
	});
};

function setDefaultOptions(opts) {
	opts = opts || {};
	opts.mongoUrl = opts.mongoUrl || 'mongodb://localhost/nope';

	return opts;
}

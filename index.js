'use strict'

// Requires
var async = require('async')
var json2mongo = require('json2mongo')
var MongoClient = require('mongodb').MongoClient
var ObjectID = require('mongodb-core').BSON.ObjectID
var path = require('path')
var PluginError = require('plugin-error')
var through = require('through2')

module.exports = function (opts) {
  return through.obj(function (file, enc, cb) {
    // File is null - pass along
    if (file.isNull()) return cb(null, file)

    // File is stream - not supported
    if (file.isStream()) {
      return cb(
        new PluginError('gulp-mongodb-data', 'Streaming is not supported')
      )
    }

    // Set default options
    opts = setDefaultOptions(opts)

    var content = String(file.contents)
    var json

    if (!content) {
      return cb(
        new PluginError(
          'gulp-mongodb-data', 'File cannot be empty', {
            fileName: file.path,
            showStack: true
          }))
    }

    if (content[0] === '[') {
      // Assume file contains properly formatted JSON array
      try {
        json = json2mongo(JSON.parse(content))
      } catch (e) {
        return cb(
          new PluginError(
            'gulp-mongodb-data', 'Problem parsing JSON file', {
              fileName: file.path,
              showStack: true
            }))
      }
    } else if (content[0] === '{') {
      // Assume file contains mongoexport dump or single item
      json = []
      var dumpedObjects = content.split('\n')
      for (var i = 0; i < dumpedObjects.length; i++) {
        if (!dumpedObjects[i]) continue
        try {
          json.push(json2mongo(JSON.parse(dumpedObjects[i])))
        } catch (e) {
          return cb(
            new PluginError(
              'gulp-mongodb-data', 'Problem parsing JSON file', {
                fileName: file.path,
                showStack: true
              }))
        }
      }
    } else {
      // We have no idea what the user sent us
      return cb(
        new PluginError(
          'gulp-mongodb-data', 'File is not valid', {
            fileName: file.path,
            showStack: true
          }))
    }

    if (opts.idAsObjectID) {
      json = json.map(function (obj) {
        if (obj._id && typeof obj._id === 'string') {
          obj._id = ObjectID(obj._id)
        }
        return obj
      })
    }

    MongoClient.connect(opts.mongoUrl, function (err, db) {
      if (err) {
        return cb(
          new PluginError('gulp-mongodb-data', err, {showStack: true}))
      }

      var collectionName = opts.collectionName ||
        path.basename(file.path, path.extname(file.path))
      var coll = db.collection(collectionName)

      // Run methods synchronous
      async.series([
        // Drop collection if option is set and collection exists
        function (cb) {
          if (opts.dropCollection) {
            db.listCollections({name: collectionName})
              .toArray(function (err, items) {
                if (err) return cb(err)
                if (items.length) return coll.drop(cb)
                cb()
              })
          } else cb()
        },
        // Insert dato into collection
        function (cb) {
          coll.insertMany(json, cb)
        }
      ], function (err) {
        db.close()

        if (err) {
          return cb(
            new PluginError('gulp-mongodb-data', err, {showStack: true}))
        }

        // Pass on
        cb(null, file)
      })
    })
  })
}

function setDefaultOptions (opts) {
  opts = opts || {}
  opts.mongoUrl = opts.mongoUrl || `${process.env.GULP_MONGODB_DATA_DEFAULT_CONNECTIONSTRING}/nope` || 'mongodb://localhost/nope'
  opts.idAsObjectID =
    typeof opts.idAsObjectID !== 'undefined' &&
    opts.idAsObjectID !== null ? opts.idAsObjectID : true

  return opts
}

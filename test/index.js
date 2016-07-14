'use strict';

var async = require('async');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var mongodbData = require('../');
var should = require('should');
var File = require('vinyl');

require('mocha');

var dbRef;

describe('gulp-mongodb-data', function() {
  before(function(done) {
    MongoClient.connect('mongodb://localhost', function(err, db) {
      dbRef = db;
      done();
    });
  });

  after(function() {
    dbRef.close();
  });

  afterEach(function(done) {
    var testDbs = ['nope', 'nopeV2'];
    var adminDb = dbRef.admin();
    adminDb.listDatabases(function(err, result) {
      async.each(result.databases, function(db, cb) {
        if (testDbs.indexOf(db.name) >= 0)
          dbRef.db(db.name).dropDatabase(cb);
        else
          cb();
      }, done);
    });
  });

  it('should use default MongoDB url when none given', function(done) {
    var stream = mongodbData();

    stream.on('data', function() {
      var adminDb = dbRef.admin();
      adminDb.listDatabases(function(err, result) {
        async.some(result.databases, function(db, cb) {
          cb(db.name === 'nope');
        }, function(result) {
          result.should.be.true();
          done();
        });
      });
    });

    stream.write(fixture('test/fixtures/users-test.json'));
    stream.end();
  });

  it('should default to collection name from file name by default', function(done) {
    var stream = mongodbData();

    stream.on('data', function() {
      var db = dbRef.db('nope');
      db.listCollections().toArray(function(err, collections) {
        async.some(collections, function(coll, cb) {
          cb(coll.name === 'users-test');
        }, function(result) {
          result.should.be.true();
          done();
        });
      });
    });

    stream.write(fixture('test/fixtures/users-test.json'));
    stream.end();
  });

  it('should not drop collection by default', function(done) {
    var db = dbRef.db('nope');
    var coll = db.collection('users-test');
    var existingUser = {
      firstName: 'David',
      lastName: 'Guetta'
    };

    coll.insert(existingUser, function() {
      var stream = mongodbData();

      stream.on('data', function() {
        coll.count(function(err, count) {
          count.should.eql(6);
          done();
        });
      });

      stream.write(fixture('test/fixtures/users-test.json'));
      stream.end();
    });
  });

  it('should use specified MongoDB url', function(done) {
    var stream = mongodbData({
      mongoUrl: 'mongodb://localhost/nopeV2'
    });

    stream.on('data', function() {
      var adminDb = dbRef.admin();
      adminDb.listDatabases(function(err, result) {
        async.some(result.databases, function(db, cb) {
          cb(db.name === 'nopeV2');
        }, function(result) {
          result.should.be.true();
          done();
        });
      });
    });

    stream.write(fixture('test/fixtures/users-test.json'));
    stream.end();
  });

  it('should use specified collection name', function(done) {
    var stream = mongodbData({
      collectionName: 'lolcats'
    });

    stream.on('data', function() {
      var db = dbRef.db('nope');
      db.listCollections().toArray(function(err, collections) {
        async.some(collections, function(coll, cb) {
          cb(coll.name === 'lolcats');
        }, function(result) {
          result.should.be.true();
          done();
        });
      });
    });

    stream.write(fixture('test/fixtures/users-test.json'));
    stream.end();
  });

  it('should drop collection when specified', function(done) {
    var db = dbRef.db('nope');
    var coll = db.collection('users-test');
    var existingUser = {
      firstName: 'David',
      lastName: 'Guetta'
    };

    coll.insert(existingUser, function() {
      var stream = mongodbData({
        dropCollection: true
      });

      stream.on('data', function() {
        coll.count(function(err, count) {
          count.should.eql(5);
          done();
        });
      });

      stream.write(fixture('test/fixtures/users-test.json'));
      stream.end();
    });
  });

  it('should be able to load multiple files', function(done) {
    var stream = mongodbData();
    var counter = 0;

    stream.on('data', function() {
      counter++;
      if (counter < 2) return;

      var db = dbRef.db('nope');
      db.listCollections().toArray(function(err, collections) {
        async.filter(collections, function(coll, cb) {
          cb(['users-test', 'addresses-test'].indexOf(coll.name) >= 0);
        }, function(result) {
          result.length.should.eql(2);
          done();
        });
      });
    });

    stream.write(fixture('test/fixtures/users-test.json'));
    stream.write(fixture('test/fixtures/addresses-test.json'));
    stream.end();
  });

  it('should put objects from files into collection', function(done) {
    var stream = mongodbData();

    stream.on('data', function() {
      var db = dbRef.db('nope');
      var coll = db.collection('users-test');

      coll.find().toArray(function(err, users) {
        users.length.should.eql(5);
        users[2].firstName.should.eql("Han");
        users[4].lastName.should.eql('Nuts');
        users[1]._id.should.be.Object();
        users[1]._id.toString().should.eql('578611d17c8a27dd5b329fd5');
        done();
      });
    });

    stream.write(fixture('test/fixtures/users-test.json'));
    stream.end();
  });
});

function fixture(path) {
  return new File({
    path: path,
    contents: fs.readFileSync(path)
  });
}

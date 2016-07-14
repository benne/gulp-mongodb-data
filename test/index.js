'use strict'

var async = require('async')
var fs = require('fs')
var MongoClient = require('mongodb').MongoClient
var mongodbData = require('../')
var File = require('vinyl')

require('mocha')
require('should')

var dbRef

describe('gulp-mongodb-data', function () {
  before(function (done) {
    MongoClient.connect('mongodb://localhost', function (err, db) {
      if (err) throw err
      dbRef = db
      done()
    })
  })

  after(function () {
    dbRef.close()
  })

  afterEach(function (done) {
    var testDbs = ['nope', 'nopeV2']
    var adminDb = dbRef.admin()
    adminDb.listDatabases(function (err, result) {
      if (err) throw err
      async.each(result.databases, function (db, cb) {
        if (testDbs.indexOf(db.name) >= 0) dbRef.db(db.name).dropDatabase(cb)
        else cb()
      }, done)
    })
  })

  it('should use default MongoDB url when none given', function (done) {
    var stream = mongodbData()

    stream.on('data', function () {
      var adminDb = dbRef.admin()
      adminDb.listDatabases(function (err, result) {
        if (err) throw err
        async.some(result.databases, function (db, cb) {
          cb(null, db.name === 'nope')
        }, function (err, result) {
          if (err) throw err
          result.should.be.true()
          done()
        })
      })
    })

    stream.write(fixture('test/fixtures/users-test.json'))
    stream.end()
  })

  it('should default to collection name from file name by default', function (done) {
    var stream = mongodbData()

    stream.on('data', function () {
      var db = dbRef.db('nope')
      db.listCollections().toArray(function (err, collections) {
        if (err) throw err
        async.some(collections, function (coll, cb) {
          cb(null, coll.name === 'users-test')
        }, function (err, result) {
          if (err) throw err
          result.should.be.true()
          done()
        })
      })
    })

    stream.write(fixture('test/fixtures/users-test.json'))
    stream.end()
  })

  it('should not drop collection by default', function (done) {
    var db = dbRef.db('nope')
    var coll = db.collection('users-test')
    var existingUser = {
      firstName: 'David',
      lastName: 'Guetta'
    }

    coll.insert(existingUser, function () {
      var stream = mongodbData()

      stream.on('data', function () {
        coll.count(function (err, count) {
          if (err) throw err
          count.should.eql(6)
          done()
        })
      })

      stream.write(fixture('test/fixtures/users-test.json'))
      stream.end()
    })
  })

  it('should use specified MongoDB url', function (done) {
    var stream = mongodbData({
      mongoUrl: 'mongodb://localhost/nopeV2'
    })

    stream.on('data', function () {
      var adminDb = dbRef.admin()
      adminDb.listDatabases(function (err, result) {
        if (err) throw err
        async.some(result.databases, function (db, cb) {
          cb(null, db.name === 'nopeV2')
        }, function (err, result) {
          if (err) throw err
          result.should.be.true()
          done()
        })
      })
    })

    stream.write(fixture('test/fixtures/users-test.json'))
    stream.end()
  })

  it('should use specified collection name', function (done) {
    var stream = mongodbData({
      collectionName: 'lolcats'
    })

    stream.on('data', function () {
      var db = dbRef.db('nope')
      db.listCollections().toArray(function (err, collections) {
        if (err) throw err
        async.some(collections, function (coll, cb) {
          cb(null, coll.name === 'lolcats')
        }, function (err, result) {
          if (err) throw err
          result.should.be.true()
          done()
        })
      })
    })

    stream.write(fixture('test/fixtures/users-test.json'))
    stream.end()
  })

  it('should drop collection when specified', function (done) {
    var db = dbRef.db('nope')
    var coll = db.collection('users-test')
    var existingUser = {
      firstName: 'David',
      lastName: 'Guetta'
    }

    coll.insert(existingUser, function () {
      var stream = mongodbData({
        dropCollection: true
      })

      stream.on('data', function () {
        coll.count(function (err, count) {
          if (err) throw err
          count.should.eql(5)
          done()
        })
      })

      stream.write(fixture('test/fixtures/users-test.json'))
      stream.end()
    })
  })

  it('should be able to load multiple files', function (done) {
    var stream = mongodbData()
    var counter = 0

    stream.on('data', function () {
      counter++
      if (counter < 2) return

      var db = dbRef.db('nope')
      db.listCollections().toArray(function (err, collections) {
        if (err) throw err
        async.filter(collections, function (coll, cb) {
          cb(null, ['users-test', 'addresses-test'].indexOf(coll.name) >= 0)
        }, function (err, result) {
          if (err) throw err
          result.length.should.eql(2)
          done()
        })
      })
    })

    stream.write(fixture('test/fixtures/users-test.json'))
    stream.write(fixture('test/fixtures/addresses-test.json'))
    stream.end()
  })

  it('should put objects from files into collection', function (done) {
    var stream = mongodbData()

    stream.on('data', function () {
      var db = dbRef.db('nope')
      var coll = db.collection('users-test')

      coll.find().toArray(function (err, users) {
        if (err) throw err
        users.length.should.eql(5)
        users[2].firstName.should.eql('Han')
        users[4].lastName.should.eql('Nuts')
        users[1]._id.should.be.Object()
        users[1]._id.toString().should.eql('578611d17c8a27dd5b329fd5')
        done()
      })
    })

    stream.write(fixture('test/fixtures/users-test.json'))
    stream.end()
  })

  it('should put objects from mongoexport file into collection', function (done) {
    var stream = mongodbData()

    stream.on('data', function () {
      var db = dbRef.db('nope')
      var coll = db.collection('export-test')

      coll.find().toArray(function (err, objs) {
        if (err) throw err
        objs.length.should.eql(3)
        objs[0].first.should.eql('Brian')
        objs[1].last.should.eql('Coughlin')
        objs[2].birthdate.should.eql(new Date('1963-10-06T00:00:00.000Z'))
        objs[1].male.should.be.true()
        objs[2].appearance.should.eql(3)
        objs[1]._id.should.be.Object()
        objs[1]._id.toString().should.eql('5787d450596cca272cab90bb')
        done()
      })
    })

    stream.write(fixture('test/fixtures/export-test.json'))
    stream.end()
  })
})

function fixture (path) {
  return new File({
    path: path,
    contents: fs.readFileSync(path)
  })
}

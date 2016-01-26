/**
 * Created by hrbu on 24.11.2015.
 * This file implements the global mocha root-level hooks 'before' and 'after'.
 * @see https://mochajs.org/#hooks >> Root-Level Hooks
 *
 * The test suite expects to have a boot2docker-instance running.
 */

/* globals before, after */
'use strict'
var opts = {
  couchUrl: 'http://admin:admin@boot2docker.me:5984',
  dbNamePrefix: 'webpackage-store',
  storeName: 'base-api-upload-test',
  finallyRemoveTestData: true
}
var supercouch = require('supercouch')
var request = require('superagent')
var couch = supercouch(opts.couchUrl)
var dbName = opts.dbNamePrefix + '-' + opts.storeName
var userDoc = {
  '_id': 'org.couchdb.user:base-api-test-user',
  'name': 'base-api-test-user',
  'roles': [],
  'type': 'user',
  'password': 'cubbles'
}

function removeDb (done, next) {
  couch
    .dbExists(dbName)
    .end(function (err, res) {
      if (err) {
        return done(err)
      }
      // db does exist
      if (res === true) {
        console.log('Removing database: %s', dbName)
        couch
          .dbDel(dbName)
          .end(function (err, res) {
            if (err) {
              return done(err)
            }
            if (next) {
              next(done)
            } else {
              done()
            }
          })
      } else {
        if (next) {
          next(done)
        } else {
          done()
        }
      }
    })
}

function addDb (done) {
  console.log('Creating database: %s', dbName)
  couch
    .dbAdd(dbName)
    .end(function (err, res) {
      if (err) {
        console.log('dbAdd failed', err)
        return done(err)
      }
      replicateFromCore(done)
    })
}

function replicateFromCore (done) {
  request.post(opts.couchUrl + '/_replicate')
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send('{"source":"webpackage-store-core","target":"' + dbName + '", "doc_ids":["_design/couchapp-webpackage-validator"]}')
    .end(function (err, res) {
      if (err) {
        console.log('replication form core failed', err)
        return done(err)
      }
      addStoreDocument(done)
    })
}

function addStoreDocument (done) {
  var doc = { _id: 'pack@1.0.0', foo: 'bar' }
  console.log('Creating document: %s\n', doc._id)
  couch
    .db(dbName)
    .insert(doc)
    .end(function (err, res) {
      if (err) {
        console.log('document insert failed', err)
        return done(err)
      }
      done()
    })
}

before(function (done) {
  // function: create a test user
  console.log('before ....')
  function addUser (next) {
    console.log('Creating user: %s\n', userDoc._id)
    // run a compaction to remove the users, already marked as _deleted
    request.post(opts.couchUrl + '/_users/_compact')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        if (err) {
          console.log('requesting compaction failed', err)
          return done(err)
        }
        console.log('compaction response', res.body)
        // create a test-user (or re-use one
        couch
          .db('_users')
          .get(userDoc._id)
          .end(function (err, res) {
            if (err) {
              console.log('requested for existing user - err:', err)
            }
            // return if user does already exist
            if (res) {
              console.log('requested for existing user -res:', res)
              next()
              return
            }
            // otherwise ... create the user
            couch
              .db('_users')
              .insert(userDoc)
              .end(function (err, res) {
                if (err) {
                  console.log('document update failed', err)
                  return done(err)
                }
                next()
              })
          })
      })
  }

  // add testuser and test-database
  addUser(function () {
    removeDb(done, addDb)
  })
})

after(function (done) {
  function removeUser (next) {
    console.log('Remove user: %s\n', userDoc._id)
    couch
      .db('_users')
      .get(userDoc._id)
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        couch
          .db('_users')
          .remove(userDoc._id, res._rev)
          .end(function (err, res) {
            if (err) {
              console.log('removeUser failed', err)
              return done(err)
            }
            // run a compaction to really remove the users documents
            request.post(opts.couchUrl + '/_users/_compact')
              .set('Content-Type', 'application/json')
              .set('Accept', 'application/json')
              .end(function (err, res) {
                if (err) {
                  console.log('compaction failed', err)
                  return done(err)
                }
                next()
              })
          })
      })
  }

  // remove testuser and test-database

  if (opts.finallyRemoveTestData) {
    removeUser(function () {
      removeDb(done)
    })
  } else {
    done()
  }
})


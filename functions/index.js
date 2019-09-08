'use strict'
const glob = require('glob')
const camelCase = require('camelcase')
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')({
  keyFilename:'perrinn-d5fc1-firebase-adminsdk-rh8x2-b26a8ffeef.json',
});
const spawn = require('child-process-promise').spawn;
const admin = require('firebase-admin');
admin.initializeApp();
var u = require('url');
var crypto = require('crypto');
var request = require('request-promise');

const {google} = require('googleapis');

const files = glob.sync('./**/*.f.js', { cwd: __dirname, ignore: './node_modules/**' })
for (let f = 0, fl = files.length; f < fl; f++) {
  const file = files[f]
  const functionName = camelCase(file.slice(0, -5).split('/').join('_')) // Strip off '.f.js'
  if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === functionName) {
    exports[functionName] = require(file)
  }
}

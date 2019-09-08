const admin = require('firebase-admin')
var crypto = require('crypto');
const functions = require('firebase-functions')

module.exports = {

  // creates random 25-character string
  buildNonce:()=>{
    var chars = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0',
      '1', '2', '3', '4', '5', '6', '7', '8', '9'
    ];
    var nonce = '';
    for (var i = 0; i < 25; i++) {
      nonce += chars[Math.floor(Math.random()*chars.length)];
    }
    return nonce;
  },

}

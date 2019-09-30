const admin = require('firebase-admin')
const createMessageUtils = require('./createMessage')
const cryptoUtils = require('./crypto')
var crypto = require('crypto');
var request = require('request-promise');
const functions = require('firebase-functions')
var u = require('url');

module.exports = {

  joinPERRINNOnshapeTeam:(user)=>{
    return admin.auth().getUser(user).then(function(userRecord) {
      var email=userRecord.toJSON().email;
      var method='POST';
      var url='https://cad.onshape.com/api/teams/559f8b25e4b056aae06c1b1d/members';
      var body={'email':email,'admin':false};
      const accessKey=functions.config().onshape.accesskey;
      const secretKey=functions.config().onshape.secretkey;
      var urlObj = u.parse(url);
      var urlPath = urlObj.pathname;
      var urlQuery = urlObj.query ? urlObj.query : ''; // if no query, use empty string
      var authDate = (new Date()).toUTCString();
      var nonce = cryptoUtils.buildNonce();
      var contentType = 'application/json';
      var str = (method + '\n' + nonce + '\n' + authDate + '\n' + contentType + '\n' +
          urlPath + '\n' + urlQuery + '\n').toLowerCase();
      var hmac = crypto.createHmac('sha256', secretKey)
          .update(str)
          .digest('base64');
      var signature = 'On ' + accessKey + ':HmacSHA256:' + hmac;
      //require('request').debug = true;
      return request({
        uri: url,
        method:method,
        headers: {
          'Method':method,
          'Content-type':contentType,
          'Accept':'application/vnd.onshape.v1+json',
          'Authorization':signature,
          'Date':authDate,
          'On-Nonce':nonce
        },
        json: true,
        body: body
      }).then(result=>{
        return admin.firestore().doc('PERRINNTeams/'+user).get().then(userObjSnapshot=>{
          let userObj=userObjSnapshot.data();
          userObj.key=user;
          createMessageUtils.createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","Joined Onshape:","","",{},userObj,'none','none',{});
        }).then(()=>{
          return 'done';
        }).catch(error=>{
          console.log(error);
          return error;
        });
      }).catch(error=>{
        return error.error.message;
      });
    }).catch(error=>{
      console.log(error);
      return error;
    });
  },

}

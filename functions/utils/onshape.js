const admin = require('firebase-admin')

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

  joinOnshapePERRINNTeam:(user)=>{
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
      var nonce = buildNonce();
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
        createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","Joined Onshape:","","",user,"",'none','none',{});
        return 'done';
      }).catch(error=>{
        return error.error.message;
      });
    }).catch(error=>{
      console.log(error);
      return error;
    });
  },

}

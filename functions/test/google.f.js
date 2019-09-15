const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  return joinPERRINNOnshapeTeam('QYm5NATKa6MGD87UpNZCTl6IolX2').then(result=>{
    console.log(result);
  });
});

const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  return admin.firestore().doc('PERRINNTeams/QYm5NATKa6MGD87UpNZCTl6IolX2').get().then(result=>{
    console.log(result.data().name);
    return null;
  }).catch(error=>{
    console.log(error);
    return null;
  });
});

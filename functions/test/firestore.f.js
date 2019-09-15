const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
  return admin.firestore().doc('PERRINNTeams/-KptLVvLV9lRK1VS-nAj').get().then(result=>{
    console.log(JSON.stringify(result.data().members['SSYanAoIexPdEih8M8NrJZrYnv2']));
    return null;
  }).catch(error=>{
    console.log(error);
    return null;
  });
});

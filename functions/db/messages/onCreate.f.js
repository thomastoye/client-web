const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')

exports=module.exports=functions.firestore.document('PERRINNTeams/{team}/messages/{message}').onCreate((data,context)=>{
  var batch = admin.firestore().batch();
  batch.update(admin.firestore().doc('lastMessages/'+data.data().recipientIndex),data.data(),{create:true});
  return batch.commit().then(()=>{
    return 'done';
  }).catch(error=>{
    console.log(error);
    return error;
  });
});

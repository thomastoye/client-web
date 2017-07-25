const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.verifyTransactions = functions.database.ref('/teamTransactions/{teamID}/{transactionID}').onCreate(event => {
  const transaction = event.data.val();
  console.log("Found pending transaction");
  var balance=0;
  admin.database().ref('PERRINNTransactions/').orderByChild('sender').equalTo(event.params.teamID).once('value').then(PERRINNTransactions=>{
    PERRINNTransactions.forEach(function(PERRINNTransaction){
      balance-=PERRINNTransaction.val().amount;
    });
  }).then(()=>{
    admin.database().ref('PERRINNTransactions/').orderByChild('receiver').equalTo(event.params.teamID).once('value').then(PERRINNTransactions=>{
      PERRINNTransactions.forEach(function(PERRINNTransaction){
        balance+=PERRINNTransaction.val().amount;
      });
    }).then(()=>{
      console.log("Balance sender", balance)
      if (balance>=transaction.amount) {
        admin.database().ref('PERRINNTransactions/'+event.params.transactionID).update({
          amount: transaction.amount,
          sender: event.params.teamID,
          receiver: transaction.receiver,
          reference: transaction.reference,
          createdTimestamp: transaction.createdTimestamp,
          verifiedTimestamp: admin.database.ServerValue.TIMESTAMP,
        }).then(()=>{
          return admin.database().ref('teamTransactions/'+event.params.teamID+'/'+event.params.transactionID).update({
            status: "verified",
          });
        });
      }
      else {return null}
    });
  });
});

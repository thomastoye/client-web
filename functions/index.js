const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.verifyTransactions = functions.database.ref('/teamTransactions/{teamID}/{transactionID}').onCreate(event => {
  const transaction = event.data.val();
  console.log("Found pending transaction");
  return admin.database().ref('PERRINNTransactionsTest/'+event.params.transactionID).update({
    amount: transaction.amount,
    sender: event.params.teamID,
    receiver: transaction.receiver,
    reference: transaction.reference,
    createdTimestamp: transaction.createdTimestamp,
    verifiedTimestamp: admin.database.ServerValue.TIMESTAMP,
  });
});

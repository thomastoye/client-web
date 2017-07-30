const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token);

exports.verifyTransactions = functions.database.ref('/teamTransactions/{teamID}/{transactionID}').onCreate(event => {
  const transaction = event.data.val();
  var balance=0;
  admin.database().ref('PERRINNTransactions/').orderByChild('sender').equalTo(event.params.teamID).once('value').then(PERRINNTransactions=>{
    PERRINNTransactions.forEach(function(PERRINNTransaction){
      balance-=Number(PERRINNTransaction.val().amount);
    });
  }).then(()=>{
    admin.database().ref('PERRINNTransactions/').orderByChild('receiver').equalTo(event.params.teamID).once('value').then(PERRINNTransactions=>{
      PERRINNTransactions.forEach(function(PERRINNTransaction){
        balance+=Number(PERRINNTransaction.val().amount);
      });
    }).then(()=>{
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

exports.createStripeCharge = functions.database.ref('/userPayments/{userID}/{chargeID}').onCreate(event => {
  const val = event.data.val();
  if (val === null || val.id || val.error) return null;
  const amount = val.amountCharge;
  const currency = val.currency;
  const source = val.source;
  const idempotency_key = event.params.id;
  let charge = {amount, currency, source};
  return stripe.charges.create(charge, {idempotency_key})
  .then(response => {
    return event.data.adminRef.child('response').set(response);
  }, error => {
    event.data.adminRef.child('error').update({type: error.type});
    return event.data.adminRef.child('error').update({message: error.message});
  });
});

exports.createPERRINNTransactionOnPaymentComplete = functions.database.ref('/userPayments/{userID}/{chargeID}/response/outcome').onCreate(event => {
  const val = event.data.val();
  if (val.seller_message=="Payment complete.") {
    admin.database().ref('userPayments/'+event.params.userID+'/'+event.params.chargeID).once('value').then(payment=>{
      admin.database().ref('teamTransactions/-KptHjRmuHZGsubRJTWJ').push({
        reference: "Payment reference: " + event.params.chargeID,
        amount: payment.val().amountCOINSPurchased,
        receiver: payment.val().team,
        createdTimestamp: admin.database.ServerValue.TIMESTAMP,
        status: "pending"
      }).then(()=>{
        return admin.database().ref('userPayments/'+event.params.userID+'/'+event.params.chargeID+'/PERRINNTransaction').update({
          message: "COINS have been transfered to your team wallet."
        });
      });
    });
  }
});

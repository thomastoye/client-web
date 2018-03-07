const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token);

function createMessage (team, user, text, image, action, timestamp) {
  admin.database().ref('PERRINNTeamMessages/'+team).push({
    timestamp:timestamp,
    text:text,
    user:user,
    image:image,
    action:action,
  });
  admin.database().ref('teamActivities/'+team).update({
    lastMessageTimestamp:timestamp,
  });
  admin.database().ref('userTeams/'+user+'/'+team).update({
    lastChatVisitTimestamp:timestamp,
    lastChatVisitTimestampNegative:-1*timestamp,
  });
}

function createTransaction (amount, sender, receiver, user, reference, timestamp) {
  return admin.database().ref('PERRINNTeamBalance/'+sender).once('value').then((senderBalance)=>{
    return admin.database().ref('PERRINNTeamBalance/'+receiver).once('value').then((receiverBalance)=>{
      var balanceSenderPre=senderBalance.val().balance;
      var balanceSenderPost=balanceSenderPre-amount;
      var balanceReceiverPre=receiverBalance.val().balance;
      var balanceReceiverPost=balanceReceiverPre+amount;
      if (balanceSenderPre>=amount) {
        admin.database().ref('PERRINNTeamTransactions/'+sender).push({
          amount: -amount,
          balance: balanceSenderPost,
          otherTeam: receiver,
          reference: reference,
          requestTimestamp: timestamp,
          timestamp: admin.database.ServerValue.TIMESTAMP,
          timestampNegative: -timestamp,
          user: user,
        });
        admin.database().ref('PERRINNTeamTransactions/'+receiver).push({
          amount: amount,
          balance: balanceReceiverPost,
          otherTeam: sender,
          reference: reference,
          requestTimestamp: timestamp,
          timestamp: admin.database.ServerValue.TIMESTAMP,
          timestampNegative: -timestamp,
          user: user,
        });
        admin.database().ref('PERRINNTeamBalance/'+sender).update({balance:balanceSenderPost,balanceNegative:-balanceSenderPost});
        admin.database().ref('PERRINNTeamBalance/'+receiver).update({balance:balanceReceiverPost,balanceNegative:-balanceReceiverPost});
        return 1;
      }
      else {
        createMessage (sender,"PERRINN","Your COIN balance is too low.","","warning",timestamp+1);
        return null
      }
    });
  });
}

exports.createPERRINNTransactionOnPaymentComplete = functions.database.ref('/teamPayments/{user}/{chargeID}/response/outcome').onCreate(event => {
  const val = event.data.val();
  if (val.seller_message=="Payment complete.") {
    admin.database().ref('teamPayments/'+event.params.user+'/'+event.params.chargeID).once('value').then(payment=>{
      return createTransaction (payment.val().amountCOINSPurchased, "-KptHjRmuHZGsubRJTWJ", payment.val().team, "PERRINN", "Payment reference: "+event.params.chargeID, admin.database.ServerValue.TIMESTAMP).then((result)=>{
        if (result) {
          return admin.database().ref('teamPayments/'+event.params.user+'/'+event.params.chargeID+'/PERRINNTransaction').update({
            message: "COINS have been transfered to your team wallet."
          });
        }
      });
    });
  }
});

exports.updateProjectLeader = functions.database.ref('/projectTeams').onWrite(event => {
  admin.database().ref('projectTeams/').once('value').then(projects=>{
    projects.forEach(function(project){
      admin.database().ref('projectTeams/'+project.key).once('value').then(projectTeams=>{
        projectTeams.forEach(function(projectTeam){
          if (projectTeam.val().leader) {
            admin.database().ref('projects/'+project.key).update({leader:projectTeam.key});
          }
        });
      });
    });
  });
});

exports.newStripeCharge = functions.database.ref('/teamPayments/{user}/{chargeID}').onCreate(event => {
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

exports.newUserProfile = functions.database.ref('/users/{user}/{editID}').onCreate(event => {
  const profile = event.data.val();
  admin.database().ref('PERRINNUsers/'+event.params.user).update({
    firstName: profile.firstName,
    lastName: profile.lastName,
    photoURL: profile.photoURL,
  });
});

exports.newMessage = functions.database.ref('/teamMessages/{team}/{message}').onCreate(event => {
  const message = event.data.val();
  createMessage (event.params.team,message.user,message.text,message.image,message.action,message.timestamp);
  if (message.action=="transaction") {
    admin.database().ref('teamUsers/'+event.params.team+'/'+message.user).once('value').then((teamUser)=>{
      if (teamUser.val().leader) {
        createTransaction (message.amount, event.params.team, message.receiver, message.user, message.reference, message.timestamp).then((result)=>{
          if (result) {
            admin.database().ref('appSettings/cost/').once('value').then(cost => {
              createTransaction (cost.val().transaction, event.params.team, "-L6XIigvAphrJr5w2jbf", message.user, "transaction cost", message.timestamp).then(()=>{
                createMessage (event.params.team,"PERRINN","You have sent "+message.amount+" COINS.","","confirmation",message.timestamp+1);
                createMessage (message.receiver,"PERRINN","You have received "+message.amount+" COINS.","","confirmation",message.timestamp+1);
              });
            });
          }
        });
      } else {
        createMessage (event.params.team,"PERRINN","You need to be leader to send COINS.","","warning",message.timestamp+1);
      }
    });
  }
});

exports.useForWhatEver = functions.database.ref('toto').onCreate(event => {
});

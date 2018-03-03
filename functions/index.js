const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token);

function updateTeamBalance (teamID) {
  var balance=0;
  return admin.database().ref('PERRINNTransactions/').orderByChild('sender').equalTo(teamID).once('value').then(PERRINNTransactions=>{
    PERRINNTransactions.forEach(function(PERRINNTransaction){
      balance-=Number(PERRINNTransaction.val().amount);
    });
  }).then(()=>{
    return admin.database().ref('PERRINNTransactions/').orderByChild('receiver').equalTo(teamID).once('value').then(PERRINNTransactions=>{
      PERRINNTransactions.forEach(function(PERRINNTransaction){
        balance+=Number(PERRINNTransaction.val().amount);
      });
    }).then(()=>{
      admin.database().ref('PERRINNTeamBalance/'+teamID).update({balance:balance,balanceNegative:-balance});
      return balance;
    }).catch(()=>{
      return 0;
    });
  });
}

function createTransaction (amount, sender, receiver, user, reference, timestamp) {
  return updateTeamBalance(sender).then((balance)=>{
    if (balance>=amount) {
      return admin.database().ref('PERRINNTransactions/').push({
        amount: amount,
        sender: sender,
        receiver: receiver,
        user: user,
        reference: reference,
        createdTimestamp: timestamp,
        verifiedTimestamp: admin.database.ServerValue.TIMESTAMP,
      }).then(()=>{
        updateTeamBalance(sender);
        updateTeamBalance(receiver);
        return 1;
      });
    }
    else {return null}
  });
}

exports.createPERRINNTransactionOnPaymentComplete = functions.database.ref('/teamPayments/{userID}/{chargeID}/response/outcome').onCreate(event => {
  const val = event.data.val();
  if (val.seller_message=="Payment complete.") {
    admin.database().ref('teamPayments/'+event.params.userID+'/'+event.params.chargeID).once('value').then(payment=>{
      return createTransaction (payment.val().amountCOINSPurchased, "-KptHjRmuHZGsubRJTWJ", payment.val().team, "PERRINN", "Payment reference: "+event.params.chargeID, admin.database.ServerValue.TIMESTAMP).then((result)=>{
        if (result) {
          return admin.database().ref('teamPayments/'+event.params.userID+'/'+event.params.chargeID+'/PERRINNTransaction').update({
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

exports.newStripeCharge = functions.database.ref('/teamPayments/{userID}/{chargeID}').onCreate(event => {
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

exports.newUserProfile = functions.database.ref('/users/{userID}/{editID}').onCreate(event => {
  const profile = event.data.val();
  admin.database().ref('PERRINNUsers/'+event.params.userID).update({
    firstName: profile.firstName,
    lastName: profile.lastName,
    photoURL: profile.photoURL,
  });
});

exports.newMessage = functions.database.ref('/teamMessages/{teamID}/{messageID}').onCreate(event => {
  const message = event.data.val();
  admin.database().ref('teamMessages/'+event.params.teamID+'/'+event.params.messageID).update({
    timestampNegative:-1*message.timestamp
  });
  admin.database().ref('teamActivities/'+event.params.teamID).update({
    lastMessageTimestamp:message.timestamp
  });
  admin.database().ref('userTeams/'+message.user+'/'+event.params.teamID).update({
    lastChatVisitTimestamp:message.timestamp,
    lastChatVisitTimestampNegative:-1*message.timestamp
  });
  createTransaction (message.amount, event.params.teamID, message.receiver, message.user, message.reference, message.timestamp).then((result)=>{
    if (result) {
      admin.database().ref('appSettings/cost/').once('value').then(cost => {
        createTransaction (cost.val().transaction, event.params.teamID, "-L6XIigvAphrJr5w2jbf", "PERRINN", "transaction cost", message.timestamp).then(()=>{
          admin.database().ref('teamMessages/'+event.params.teamID).push({
            timestamp: admin.database.ServerValue.TIMESTAMP,
            text: "Transaction verified",
            user: "PERRINN"
          });
        });
      });
    }
  });
  return admin.database().ref('appSettings/cost/').once('value').then(cost => {
    createTransaction (cost.val().message, event.params.teamID, "-L6XIigvAphrJr5w2jbf", "PERRINN", "message cost", message.timestamp);
    return admin.database().ref('PERRINNTeamUsage/'+event.params.teamID).child('messagesCount').transaction((current) => {
      return (current || 0) + 1;
    }).then(() => {
      return admin.database().ref('PERRINNTeamUsage/'+event.params.teamID).child('messagesCost').transaction((current) => {
        return (current || 0) + cost.val().message;
      }).then(() => {
        return console.log('Done.');
      });
    });
  });
});

exports.useForWhatEver = functions.database.ref('toto').onCreate(event => {
  return admin.database().ref('teamMessages/').once('value').then(teams=>{
    teams.forEach(function(team){
      admin.database().ref('teamMessages/'+team.key).once('value').then(messages=>{
        messages.forEach(function(message){
          admin.database().ref('teamMessages/'+team.key+'/'+message.key).update({
            user:message.val().author
          });
        });
      });
    });
  });
});

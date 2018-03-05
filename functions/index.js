const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token);

function updateTeamBalance (team) {
  var balance=0;
  return admin.database().ref('PERRINNTransactions/').orderByChild('sender').equalTo(team).once('value').then(PERRINNTransactions=>{
    PERRINNTransactions.forEach(function(PERRINNTransaction){
      balance-=Number(PERRINNTransaction.val().amount);
    });
  }).then(()=>{
    return admin.database().ref('PERRINNTransactions/').orderByChild('receiver').equalTo(team).once('value').then(PERRINNTransactions=>{
      PERRINNTransactions.forEach(function(PERRINNTransaction){
        balance+=Number(PERRINNTransaction.val().amount);
      });
    }).then(()=>{
      admin.database().ref('PERRINNTeamBalance/'+team).update({balance:balance,balanceNegative:-balance});
      return balance;
    }).catch(()=>{
      return 0;
    });
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
        return admin.database().ref('PERRINNTransactions/').push({
          amount: amount,
          sender: sender,
          receiver: receiver,
          user: user,
          reference: reference,
          createdTimestamp: timestamp,
          verifiedTimestamp: admin.database.ServerValue.TIMESTAMP,
          balanceSenderPost: balanceSenderPost,
          balanceReceiverPost: balanceReceiverPost,
        }).then(()=>{
          admin.database().ref('PERRINNTeamBalance/'+sender).update({balance:balanceSenderPost,balanceNegative:-balanceSenderPost});
          admin.database().ref('PERRINNTeamBalance/'+receiver).update({balance:balanceReceiverPost,balanceNegative:-balanceReceiverPost});
          return 1;
        });
      }
      else {
        admin.database().ref('PERRINNTeamMessages/'+sender).push({
          timestamp: admin.database.ServerValue.TIMESTAMP,
          text: "Your COIN balance is too low.",
          user: "PERRINN",
          action: "warning"
        });
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

exports.newPERRINNMessage = functions.database.ref('/PERRINNTeamMessages/{team}/{message}').onCreate(event => {
  const message = event.data.val();
  admin.database().ref('teamActivities/'+event.params.team).update({
    lastMessageTimestamp:message.timestamp
  });
  admin.database().ref('userTeams/'+message.user+'/'+event.params.team).update({
    lastChatVisitTimestamp:message.timestamp,
    lastChatVisitTimestampNegative:-1*message.timestamp
  });
});

exports.newMessage = functions.database.ref('/teamMessages/{team}/{message}').onCreate(event => {
  const message = event.data.val();
  admin.database().ref('PERRINNTeamMessages/'+event.params.team+'/'+event.params.message).update({
    timestamp:message.timestamp,
    timestampNegative:-1*message.timestamp,
    text:message.text,
    user:message.user,
    image:message.image,
    action:message.action
  });
  if (message.action=="transaction") {
    admin.database().ref('teamUsers/'+event.params.team+'/'+message.user).once('value').then((teamUser)=>{
      if (teamUser.val().leader) {
        createTransaction (message.amount, event.params.team, message.receiver, message.user, message.reference, message.timestamp).then((result)=>{
          if (result) {
            admin.database().ref('appSettings/cost/').once('value').then(cost => {
              createTransaction (cost.val().transaction, event.params.team, "-L6XIigvAphrJr5w2jbf", message.user, "transaction cost", message.timestamp).then(()=>{
                admin.database().ref('PERRINNTeamMessages/'+event.params.team).push({
                  timestamp: admin.database.ServerValue.TIMESTAMP,
                  text: "You have sent "+message.amount+" COINS.",
                  user: "PERRINN",
                  action: "confirmation"
                });
                admin.database().ref('PERRINNTeamMessages/'+message.receiver).push({
                  timestamp: admin.database.ServerValue.TIMESTAMP,
                  text: "You have received "+message.amount+" COINS.",
                  user: "PERRINN",
                  action: "confirmation"
                });
              });
            });
          }
        });
      } else {
        admin.database().ref('PERRINNTeamMessages/'+event.params.team).push({
          timestamp: admin.database.ServerValue.TIMESTAMP,
          text: "You need to be leader to send COINS.",
          user: "PERRINN",
          action: "warning"
        });
      }
    });
  }
  return admin.database().ref('appSettings/cost/').once('value').then(cost => {
    createTransaction (cost.val().message, event.params.team, "-L6XIigvAphrJr5w2jbf", message.user, "message cost", message.timestamp);
    return admin.database().ref('PERRINNTeamUsage/'+event.params.team).child('messagesCount').transaction((current) => {
      return (current || 0) + 1;
    }).then(() => {
      return admin.database().ref('PERRINNTeamUsage/'+event.params.team).child('messagesCost').transaction((current) => {
        return (current || 0) + cost.val().message;
      }).then(() => {
        return console.log('Done.');
      });
    });
  });
});

exports.useForWhatEver = functions.database.ref('toto').onCreate(event => {
  admin.database().ref('PERRINNTeamTransactions/').once('value').then(teams=>{
    teams.forEach(function(team){
      var balance=0;
      admin.database().ref('PERRINNTeamTransactions/'+team.key).once('value').then(transactions=>{
        transactions.forEach(function(transaction){
          balance=balance+transaction.val().amount;
          admin.database().ref('PERRINNTeamBalance/'+team.key).update({
            balance: balance,
            balanceNegative: -balance,
          });
        });
      });
    });
  });
});

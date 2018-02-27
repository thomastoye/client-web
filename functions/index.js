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

exports.verifyTransactions = functions.database.ref('/teamTransactions/{teamID}/{transactionID}').onCreate(event => {
  const transaction = event.data.val();
  return updateTeamBalance(event.params.teamID).then((balance)=>{
    if (balance>=transaction.amount) {
      return admin.database().ref('PERRINNTransactions/'+event.params.transactionID).update({
        amount: transaction.amount,
        sender: event.params.teamID,
        receiver: transaction.receiver,
        reference: transaction.reference,
        createdTimestamp: transaction.createdTimestamp,
        verifiedTimestamp: admin.database.ServerValue.TIMESTAMP,
      }).then(()=>{
        admin.database().ref('teamTransactions/'+event.params.teamID+'/'+event.params.transactionID).update({status: "verified"});
        updateTeamBalance(event.params.teamID);
        return updateTeamBalance(transaction.receiver);
      });
    }
    else {return null}
  });
});

exports.createStripeCharge = functions.database.ref('/teamPayments/{userID}/{chargeID}').onCreate(event => {
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

exports.createPERRINNTransactionOnPaymentComplete = functions.database.ref('/teamPayments/{userID}/{chargeID}/response/outcome').onCreate(event => {
  const val = event.data.val();
  if (val.seller_message=="Payment complete.") {
    admin.database().ref('teamPayments/'+event.params.userID+'/'+event.params.chargeID).once('value').then(payment=>{
      admin.database().ref('teamTransactions/-KptHjRmuHZGsubRJTWJ').push({
        reference: "Payment reference: " + event.params.chargeID,
        amount: payment.val().amountCOINSPurchased,
        receiver: payment.val().team,
        createdTimestamp: admin.database.ServerValue.TIMESTAMP,
        status: "pending"
      }).then(()=>{
        return admin.database().ref('teamPayments/'+event.params.userID+'/'+event.params.chargeID+'/PERRINNTransaction').update({
          message: "COINS have been transfered to your team wallet."
        });
      });
    });
  }
});

  admin.database().ref('teams/').once('value').then(teams=>{
    teams.forEach(function(team){
      var balance=0;
      admin.database().ref('PERRINNTransactions/').orderByChild('sender').equalTo(team.key).once('value').then(PERRINNTransactions=>{
        PERRINNTransactions.forEach(function(PERRINNTransaction){
          balance-=Number(PERRINNTransaction.val().amount);
          totalCOIN-=Number(PERRINNTransaction.val().amount);
        });
      }).then(()=>{
        admin.database().ref('PERRINNTransactions/').orderByChild('receiver').equalTo(team.key).once('value').then(PERRINNTransactions=>{
          PERRINNTransactions.forEach(function(PERRINNTransaction){
            balance+=Number(PERRINNTransaction.val().amount);
            totalCOIN+=Number(PERRINNTransaction.val().amount);
          });
        }).then(()=>{
          admin.database().ref('PERRINNTeamBalance/'+team.key).update({balance:balance});
          admin.database().ref('PERRINNTeamBalance/'+team.key).update({balanceNegative:-balance});
          admin.database().ref('PERRINNStatistics/').update({totalCOIN:totalCOIN});
        });
      });
    });
  });
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

exports.updateUserProfile = functions.database.ref('/users/{userID}/{editID}').onCreate(event => {
  const profile = event.data.val();
  admin.database().ref('PERRINNUsers/'+event.params.userID).update({
    firstName: profile.firstName,
    lastName: profile.lastName,
    photoURL: profile.photoURL,
  });
});

exports.newMessage = functions.database.ref('/teamMessages/{teamID}/{messageID}').onCreate(event => {
  return admin.database().ref('appSettings/cost/').once('value').then(cost => {
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

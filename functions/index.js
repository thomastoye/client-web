const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token);

function createMessage (team, user, text, image, action) {
  const now = Date.now();
  admin.database().ref('teamMessages/'+team).push({
    timestamp:now,
    text:text,
    user:user,
    image:image,
    action:action,
  });
  admin.database().ref('teamActivities/'+team).update({
    lastMessageTimestamp:now,
  });
}

function createTransaction (amount, sender, receiver, user, reference) {
  const now = Date.now();
  return createTransactionHalf (-amount,sender,receiver,user,reference,now).then((result)=>{
    if (result.committed) {
      createTransactionHalf (amount,receiver,sender,user,reference,now);
      return 1;
    } else {
      return;
    }
  });
}

function createTransactionHalf (amount, team, otherTeam, user, reference, timestamp) {
  return admin.database().ref('PERRINNTeamBalance/'+team).child('balance').transaction(function(balance) {
    if (balance===null) {
      return 999999999;
    } else {
      if (balance+amount<0) {
        return;
      } else {
        return balance+amount;
      }
    }
  }, function(error, committed, balance) {
    if (error) {
      createMessage (team,"PERRINN","Error with your transaction, please contact PERRINN Limited","","warning");
    } else if (!committed) {
      createMessage (team,"PERRINN","Your COIN balance is too low.","","warning");
    } else {
      admin.database().ref('PERRINNTeamBalance/'+team).update({balanceNegative:-balance.val()});
      admin.database().ref('PERRINNTeamTransactions/'+team).push({
        amount: amount,
        balance: balance.val(),
        otherTeam: otherTeam,
        reference: reference,
        requestTimestamp: timestamp,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        timestampNegative: -timestamp,
        user: user,
      });
    }
  });
}

exports.createPERRINNTransactionOnPaymentComplete = functions.database.ref('/teamPayments/{user}/{chargeID}/response/outcome').onCreate(event => {
  const val = event.data.val();
  if (val.seller_message=="Payment complete.") {
    admin.database().ref('teamPayments/'+event.params.user+'/'+event.params.chargeID).once('value').then(payment=>{
      return createTransaction (payment.val().amountCOINSPurchased, "-KptHjRmuHZGsubRJTWJ", payment.val().team, "PERRINN", "Payment reference: "+event.params.chargeID).then((result)=>{
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
  if (message.user=="PERRINN") {return}
  admin.database().ref('appSettings/cost/').once('value').then(cost => {
    createTransaction (cost.val().message, event.params.team, "-L6XIigvAphrJr5w2jbf", message.user, "message cost");
  });
  if (message.action=="transaction") {
    admin.database().ref('teamUsers/'+event.params.team+'/'+message.user).once('value').then((teamUser)=>{
      if (teamUser.val().leader) {
        createTransaction (message.amount, event.params.team, message.receiver, message.user, message.reference).then((result)=>{
          if (result) {
            createMessage (event.params.team,"PERRINN","You have sent "+message.amount+" COINS.","","confirmation");
            createMessage (message.receiver,"PERRINN","You have received "+message.amount+" COINS.","","confirmation");
            admin.database().ref('appSettings/cost/').once('value').then(cost => {
              createTransaction (cost.val().transaction, event.params.team, "-L6XIigvAphrJr5w2jbf", message.user, "transaction cost").then(()=>{
              });
            });
          }
        });
      } else {
        createMessage (event.params.team,"PERRINN","You need to be leader to send COINS.","","warning");
      }
    });
  }
});

exports.returnCOINS = functions.database.ref('tot').onCreate(event => {
  admin.database().ref('PERRINNTeamBalance/').once('value').then(teams=>{
    var totalAmount = teams.child('-L6XIigvAphrJr5w2jbf').val().balance;
    teams.forEach(function(team){
      var amount = totalAmount/1000000*team.val().balance;
      if (amount>0) {
        if (team.key!="-KptHjRmuHZGsubRJTWJ") {
          createTransaction (amount,"-L6XIigvAphrJr5w2jbf",team.key,"PERRINN","COIN return");
        }
      }
    });
  });
});

exports.useForWhatEver = functions.database.ref('toto').onCreate(event => {
});

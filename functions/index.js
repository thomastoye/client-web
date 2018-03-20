const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.token);

function updateKeyValue (ref,key,value) {
  return admin.database().ref(ref).child(key).once('value').then((currentValue)=>{
    if (!ref||!key||!value) {
      return;
    }
    if (currentValue.val()==value) {
      return;
    } else {
      return admin.database().ref(ref).update({
        [key]:value,
      }).then(()=>{
        return value;
      });
    }
  });
}

function addListKey (ref,list,key,maxCount) {
  const counter=list+"Count";
  return admin.database().ref(ref).child(list).once('value').then((currentList)=>{
    if (!ref||!list||!key||!maxCount) {
      return;
    }
    if (currentList.child(key).val()) {
      return;
    }
    if (currentList.numChildren()>=maxCount) {
      return "maxCount";
    }
    return admin.database().ref(ref).child(list).update({
      [key]:true,
    }).then(()=>{
      return admin.database().ref(ref).update({
        [counter]:currentList.numChildren()+1,
      }).then(()=>{
        return key;
      });
    });
  });
}

function removeListKey (ref,list,key) {
  const counter=list+"Count";
  return admin.database().ref(ref).child(list).once('value').then((currentList)=>{
    if (!ref||!list||!key) {
      return;
    }
    if (!currentList.child(key).val()) {
      return;
    }
    return admin.database().ref(ref).child(list).child(key).remove().then(()=>{
      return admin.database().ref(ref).update({
        [counter]:currentList.numChildren()-1,
      }).then(()=>{
        return key;
      });
    });
  });
}

function createMessage (team, user, text, image, action, linkTeam, linkUser) {
  const now = Date.now();
  return admin.database().ref('teamMessages/'+team).push({
    timestamp:now,
    text:text,
    user:user,
    image:image,
    action:action,
    linkTeam:linkTeam,
    linkUser:linkUser,
  }).then(()=>{
    return admin.database().ref('teamActivities/'+team).update({
      lastMessageTimestamp:now,
      lastMessageText:text,
      lastMessageUser:user,
    });
  });
}

function createTransaction (amount, sender, receiver, user, reference) {
  if (amount<=0||sender==receiver) return;
  const now = Date.now();
  return createTransactionHalf (-amount,sender,receiver,user,reference,now).then((result)=>{
    if (result.committed&&result.snapshot.val()>=0){
      createTransactionHalf (amount,receiver,sender,user,reference,now);
      return 1;
    } else {
      if (result.committed&&result.snapshot.val()<0){
        createTransactionHalf (amount,sender,receiver,user,reference+" (rejected)",now).then(()=>{
          return;
        });
        createMessage (sender,"PERRINN","Not enough COINS, transaction rejected","","warning","","");
      } else {
        return;
      }
    }
  });
}

function createTransactionHalf (amount, team, otherTeam, user, reference, timestamp) {
  return admin.database().ref('PERRINNTeamBalance/'+team).child('balance').once('value').then((balanceNullCheck)=> {
    if (balanceNullCheck.val()===null) {
      admin.database().ref('PERRINNTeamBalance/'+team).update({
        balance:0,
      });
    }
    return admin.database().ref('PERRINNTeamBalance/'+team).child('balance').transaction(function(balance) {
      return balance+amount;
    }, function(error, committed, balance) {
      if (error) {
        createMessage (team,"PERRINN","Transaction error, we will be in touch shortly","","warning","","");
        createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","Transaction error reference:","","warning",team,user);
      } else if (!committed) {
      } else {
        admin.database().ref('PERRINNTeamBalance/'+team).update({balanceNegative:-balance.val()});
        admin.database().ref('PERRINNTeamTransactions/'+team).push({
          amount: amount,
          balance: balance.val(),
          otherTeam: otherTeam,
          reference: reference,
          requestTimestamp: timestamp,
          timestamp:admin.database.ServerValue.TIMESTAMP,
          timestampNegative:-timestamp,
          user: user,
        });
      }
    });
  });
}

exports.createPERRINNTransactionOnPaymentComplete = functions.database.ref('/teamPayments/{user}/{chargeID}/response/outcome').onCreate(event => {
  const val = event.data.val();
  if (val.seller_message=="Payment complete.") {
    return admin.database().ref('teamPayments/'+event.params.user+'/'+event.params.chargeID).once('value').then(payment=>{
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
  return admin.database().ref('projectTeams/').once('value').then(projects=>{
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
  return admin.database().ref('PERRINNUsers/'+event.params.user).once('value').then((currentProfile)=>{
    if (currentProfile.val()==null) {
      admin.database().ref('PERRINNUsers/'+event.params.user).update({
        createdTimestamp:admin.database.ServerValue.TIMESTAMP,
      });
      createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New user:","","","",event.params.user);
    }
    return updateKeyValue('PERRINNUsers/'+event.params.user,"firstName",profile.firstName).then((newFirstName)=>{
      return updateKeyValue('PERRINNUsers/'+event.params.user,"lastName",profile.lastName).then((newLastName)=>{
        return updateKeyValue('PERRINNUsers/'+event.params.user,"photoURL",profile.photoURL).then((newPhotoURL)=>{
          return updateKeyValue('PERRINNUsers/'+event.params.user,"personalTeam",profile.personalTeam).then((newPersonalTeam)=>{
            return admin.database().ref('PERRINNUsers/'+event.params.user).once('value').then(newProfile=>{
              if (newFirstName) {
                createMessage (newProfile.val().personalTeam,"PERRINN",newProfile.val().firstName+": Your first name has been updated to "+newFirstName,"","confirmation","","");
              }
              if (newLastName) {
                createMessage (newProfile.val().personalTeam,"PERRINN",newProfile.val().firstName+": Your last name has been updated to "+newLastName,"","confirmation","","");
              }
              if (newPhotoURL) {
                createMessage (newProfile.val().personalTeam,"PERRINN",newProfile.val().firstName+": Your photo has been updated","","confirmation","","");
              }
              if (newPersonalTeam) {
                createMessage (newProfile.val().personalTeam,"PERRINN",newProfile.val().firstName+": This is your new personal team","","confirmation","","");
              }
            });
          });
        });
      });
    });
  });
});

exports.newTeamProfile = functions.database.ref('/teams/{team}/{editID}').onCreate(event => {
  const profile = event.data.val();
  return admin.database().ref('PERRINNTeams/'+event.params.team).once('value').then((currentProfile)=>{
    if (currentProfile.val()==null) {
      admin.database().ref('PERRINNTeams/'+event.params.team).update({
        createdTimestamp:admin.database.ServerValue.TIMESTAMP,
      });
      createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New team:","","",event.params.team,"");
    }
    return updateKeyValue('PERRINNTeams/'+event.params.team,"name",profile.name).then((newName)=>{
      return updateKeyValue('PERRINNTeams/'+event.params.team,"photoURL",profile.photoURL).then((newPhotoURL)=>{
        return addListKey('PERRINNTeams/'+event.params.team,"leaders",profile.addLeader,2).then((newLeader)=>{
          return addListKey('PERRINNTeams/'+event.params.team,"members",profile.addMember,6).then((newMember)=>{
            return removeListKey('PERRINNTeams/'+event.params.team,"members",profile.removeMember).then((oldMember)=>{
              return admin.database().ref('PERRINNTeams/'+event.params.team).once('value').then(newProfile=>{
                if (newName) {
                  createMessage (event.params.team,"PERRINN","New team name: "+newName,"","confirmation","","");
                }
                if (newPhotoURL) {
                  createMessage (event.params.team,"PERRINN","Team photo has been updated:","","confirmation",event.params.team,"");
                }
                if (profile.addLeader&&newLeader==profile.addLeader) {
                  createMessage (event.params.team,"PERRINN","New team leader:","","confirmation","",profile.addLeader);
                  admin.database().ref('PERRINNUsers/'+profile.addLeader).child('personalTeam').once('value').then((personalTeam)=>{
                    createMessage (personalTeam.val(),"PERRINN","You have been added as a leader of:","","confirmation",event.params.team,"");
                  });
                }
                if (newLeader=="maxCount") {
                  createMessage (event.params.team,"PERRINN","You already have the maximum number of leaders in your team.","","warning","","");
                }
                if (profile.addMember&&newMember==profile.addMember) {
                  createMessage (event.params.team,"PERRINN","New team member:","","confirmation","",profile.addMember);
                  admin.database().ref('PERRINNUsers/'+profile.addMember).child('personalTeam').once('value').then((personalTeam)=>{
                    createMessage (personalTeam.val(),"PERRINN","You have been added as a member of:","","confirmation",event.params.team,"");
                  });
                }
                if (newMember=="maxCount") {
                  createMessage (event.params.team,"PERRINN","You already have the maximum number of members in your team.","","warning","","");
                }
                if (profile.removeMember&&oldMember==profile.removeMember) {
                  createMessage (event.params.team,"PERRINN","Team member removed:","","confirmation","",profile.removeMember);
                  admin.database().ref('PERRINNUsers/'+profile.removeMember).child('personalTeam').once('value').then((personalTeam)=>{
                    createMessage (personalTeam.val(),"PERRINN","You have been removed from:","","confirmation",event.params.team,"");
                  });
                }
              });
            });
          });
        });
      });
    });
  });
});

function processService (service,message,team) {
  if(service.child('exemptions').child(message.user).val()==null) {
    var serviceRegex = new RegExp(service.val().regex,"i");
    if (message.text.match(serviceRegex)) {
      if (service.val().message) {
        createMessage(
          team,
          service.child('message').val().user?service.child('message').val().user:"PERRINN",
          service.child('message').val().text,
          service.child('message').val().image?service.child('message').val().image:"",
          service.child('message').val().action?service.child('message').val().action:"",
          service.child('message').val().linkTeam?service.child('message').val().linkTeam:"",
          service.child('message').val().linkUser?service.child('message').val().linkUser:"",
        );
      }
      if (service.val().serviceCost) {
        createTransaction (
          service.child('serviceCost').val().amount,
          team,
          service.child('serviceCost').val().receiver,
          message.user,
          service.child('serviceCost').val().reference,
        );
      }
      if (service.val().transaction) {
        return admin.database().ref('PERRINNTeams/'+team+'/leaders/'+message.user).once('value').then((leader)=>{
          if (leader.val()) {
            createTransaction (message.amount, team, message.receiver, message.user, message.reference).then((result)=>{
              if (result) {
                createMessage (team,"PERRINN","You have sent "+message.amount+" COINS to:","","confirmation",message.receiver,"");
                createMessage (message.receiver,"PERRINN","You have received "+message.amount+" COINS from:","","confirmation",team,"");
                admin.database().ref('PERRINNUsers/'+message.user).child('transactionCount').transaction((transactionCount)=>{
                  if (transactionCount==null) {
                    return 1;
                  } else {
                    return transactionCount+1;
                  }
                });
              }
            });
          } else {
            createMessage (team,"PERRINN","You need to be leader to send COINS.","","warning","","");
          }
        });
      }
    }
  }
}

exports.newMessage = functions.database.ref('/teamMessages/{team}/{message}').onCreate(event => {
  const message = event.data.val();
  admin.database().ref('appSettings/PERRINNServices/').once('value').then(services => {
    services.forEach((service)=>{
      processService(service,message,event.params.team);
    })
  });
  admin.database().ref('PERRINNUsers/'+message.user).child('messageCount').transaction((messageCount)=>{
    if (messageCount==null) {
      return 1;
    } else {
      return messageCount+1;
    }
  });
});

exports.returnCOINS = functions.database.ref('tot').onCreate(event => {
  return admin.database().ref('PERRINNTeamBalance/').once('value').then(teams=>{
    var totalAmount = teams.child('-L6XIigvAphrJr5w2jbf').val().balance;
    teams.forEach(function(team){
      var amount = totalAmount/1000000*team.val().balance;
      if (team.key!="-KptHjRmuHZGsubRJTWJ") {
        createTransaction (amount,"-L6XIigvAphrJr5w2jbf",team.key,"PERRINN","return");
      }
    });
  });
});

exports.loopUsers = functions.database.ref('toto').onCreate(event => {
  return admin.database().ref('PERRINNUsers').once('value').then((users)=>{
    users.forEach((user)=>{
      admin.database().ref('PERRINNUsers/'+user.key).child('teams').remove();
      admin.database().ref('PERRINNUsers/'+user.key).child('teamsCount').remove();
    });
  });
});

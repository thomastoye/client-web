const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')({
  keyFilename:'perrinn-d5fc1-firebase-adminsdk-rh8x2-b26a8ffeef.json',
});
const spawn = require('child-process-promise').spawn;
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const stripe = require('stripe')(functions.config().stripe.token);

function updateKeyValue (user,team,ref,key,value) {
  return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
    if (ref=="PERRINNUsers/"){
      ref=ref+user;
    }
    if (ref=="PERRINNTeams/"){
      if (PERRINNTeam.val().leadersCount>0&&!PERRINNTeam.child('leaders').child(user).val()) {
        return "you need to be leader";
      }
      ref=ref+team;
    }
    return admin.database().ref(ref).child(key).once('value').then((currentValue)=>{
      if (!ref||!key||!value) {
        return "not enough information";
      }
      if (currentValue.val()==value) {
        return "unchanged";
      }
      return admin.database().ref(ref).update({
        [key]:value,
      }).then(()=>{
        return "updated";
      });
    });
  }).catch(error=>{
    return error;
  });
}

function addListKeyValue (user,team,ref,list,key,value,maxCount) {
  return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
    if (ref=="PERRINNUsers/"){
      ref=ref+user;
    }
    if (ref=="PERRINNTeams/"){
      if (PERRINNTeam.val().leadersCount>0&&!PERRINNTeam.child('leaders').child(user).val()) {
        return "you need to be leader";
      }
      ref=ref+team;
    }
    const counter=list+"Count";
    return admin.database().ref(ref).child(list).once('value').then((currentList)=>{
      if (!ref||!list||!key||!maxCount) {
        return "not enough information";
      }
      if (currentList.child(key).val()) {
        return "already in";
      }
      if (currentList.numChildren()>=maxCount) {
        return "max number reached";
      }
      return admin.database().ref(ref).child(list).update({
        [key]:value,
      }).then(()=>{
        admin.database().ref(ref).update({
          [counter]:currentList.numChildren()+1,
        });
        return "added";
      });
    });
  }).catch(error=>{
    return error;
  });
}

function removeListKey (user,team,ref,list,key) {
  return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
    if (ref=="PERRINNUsers/"){
      ref=ref+user;
    }
    if (ref=="PERRINNTeams/"){
      if (PERRINNTeam.val().leadersCount>0&&!PERRINNTeam.child('leaders').child(user).val()) {
        return "you need to be leader";
      }
      ref=ref+team;
    }
    const counter=list+"Count";
    return admin.database().ref(ref).child(list).once('value').then((currentList)=>{
      if (!ref||!list||!key) {
        return "not enough information";
      }
      if (!currentList.child(key).val()) {
        return "not there";
      }
      return admin.database().ref(ref).child(list).child(key).remove().then(()=>{
        return admin.database().ref(ref).update({
          [counter]:currentList.numChildren()-1,
        }).then(()=>{
          return "removed";
        });
      });
    });
  }).catch(error=>{
    return error;
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
  return admin.database().ref('PERRINNTeams/'+sender+'/leaders/'+user).once('value').then((leader)=>{
    return admin.database().ref('PERRINNTeams/'+receiver).child('name').once('value').then((receiverName)=>{
      if (receiverName.val()==null) {
        return "team doesn't exist";
      }
      if (!leader.val()&&user!="PERRINN") {
        return "you need to be leader";
      }
      if (amount<=0||amount>10) {
        return "amount has to be between 0 and 10";
      }
      if (sender==receiver) {
        return "you cannot do that";
      }
      const now = Date.now();
      return createTransactionHalf (-amount,sender,receiver,user,reference,now).then((result)=>{
        if (result.committed&&result.snapshot.val()>=0){
          createTransactionHalf (amount,receiver,sender,user,reference,now);
          if (user!="PERRINN") {
            createMessage (receiver,"PERRINN","You have received "+amount+" COINS from:","","confirmation",sender,"");
            admin.database().ref('PERRINNUsers/'+user).child('transactionCount').transaction((transactionCount)=>{
              if (transactionCount==null) {
                return 1;
              } else {
                return transactionCount+1;
              }
            });
          }
          return "done";
        } else {
          if (result.committed&&result.snapshot.val()<0){
            createTransactionHalf (amount,sender,receiver,user,reference+" (rejected)",now).then(()=>{
              return "rejected";
            });
          } else {
            return "rejected";
          }
        }
      });
    }).catch(()=>{
      return "cancelled";
    });
  }).catch(()=>{
    return "cancelled";
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
      return Number(balance)+Number(amount);
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

function createTeam(user,team,name,photoURL) {
  const now = Date.now();
  return updateKeyValue (user,team,'PERRINNTeams/'+team,"createdTimestamp",now).then(()=>{
    updateKeyValue (user,team,'PERRINNTeams/'+team,"name",name);
    updateKeyValue (user,team,'PERRINNTeams/'+team,"photoURL",photoURL);
    addListKeyValue(user,team,'PERRINNTeams/'+team,"leaders",user,true,2);
    admin.database().ref('userTeams/'+user+'/'+team).update({
      following:true,
      lastChatVisitTimestamp:now,
      lastChatVisitTimestampNegative:-1*now,
    });
    return team;
  });
}

function createUser(user,team,firstName,lastName,photoURL) {
  const now = Date.now();
  return updateKeyValue (user,team,'PERRINNUsers/',"createdTimestamp",now).then(()=>{
    updateKeyValue (user,team,'PERRINNUsers/',"firstName",firstName);
    updateKeyValue (user,team,'PERRINNUsers/',"lastName",lastName);
    updateKeyValue (user,team,'PERRINNUsers/',"photoURL",photoURL);
    return user;
  });
}

function executeProcess(team,process){
  return admin.database().ref('appSettings/PERRINNServices/'+process.service+'/process/'+process.step).once('value').then(processStep => {
    if (processStep.val().transaction) {
      return createTransaction (
        process.inputs.amount,
        team,
        process.inputs.receiver,
        process.user,
        process.inputs.reference
      ).then(result=>{
        return result;
      });
    }
    if (processStep.val().updateKeyValue) {
      return updateKeyValue (
        process.user,
        team,
        processStep.child('updateKeyValue').val().ref,
        processStep.child('updateKeyValue').val().key,
        process.inputs[processStep.child('updateKeyValue').val().value]
      ).then(result=>{
        return result;
      });
    }
    if (processStep.val().addListKeyValue) {
      return addListKeyValue (
        process.user,
        team,
        processStep.child('addListKeyValue').val().ref,
        processStep.child('addListKeyValue').val().list,
        process.inputs[processStep.child('addListKeyValue').val().key],
        true,
        processStep.child('addListKeyValue').val().maxCount
      ).then(result=>{
        return result;
      });
    }
    if (processStep.val().removeListKey) {
      return removeListKey (
        process.user,
        team,
        processStep.child('removeListKey').val().ref,
        processStep.child('removeListKey').val().list,
        process.inputs[processStep.child('removeListKey').val().key]
      ).then(result=>{
        return result;
      });
    }
    if (processStep.val().createTeam) {
      var newTeam = admin.database().ref('ids/').push(true).key;
      return createTeam (
        process.user,
        newTeam,
        process.inputs.name,
        process.inputs.photoURL
      ).then(result=>{
        return result;
      });
    }
  }).catch(error=>{
    return error;
  }).then(result=>{
    return result;
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
    }
    if (profile.firstName) updateKeyValue(event.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+event.params.user,"firstName",profile.firstName);
    if (profile.lastName) updateKeyValue(event.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+event.params.user,"lastName",profile.lastName);
    if (profile.photoURL) updateKeyValue(event.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+event.params.user,"photoURL",profile.photoURL);
    if (profile.personalTeam) updateKeyValue(event.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+event.params.user,"personalTeam",profile.personalTeam);
  });
});

exports.newTeamProfile = functions.database.ref('/teams/{team}/{editID}').onCreate(event => {
  const profile = event.data.val();
  return admin.database().ref('PERRINNTeams/'+event.params.team).once('value').then((currentProfile)=>{
    if (currentProfile.val()==null) {
      admin.database().ref('PERRINNTeams/'+event.params.team).update({
        createdTimestamp:admin.database.ServerValue.TIMESTAMP,
      });
    }
    if(profile.name) updateKeyValue("",event.params.team,'PERRINNTeams/'+event.params.team,"name",profile.name);
    if(profile.photoURL) updateKeyValue("",event.params.team,'PERRINNTeams/'+event.params.team,"photoURL",profile.photoURL);
    if(profile.addLeader) addListKeyValue("",event.params.team,'PERRINNTeams/'+event.params.team,"leaders",profile.addLeader,true,2);
    if(profile.addMember) addListKeyValue("",event.params.team,'PERRINNTeams/'+event.params.team,"members",profile.addMember,true,6);
    if(profile.removeMember) removeListKey("",event.params.team,'PERRINNTeams/'+event.params.team,"members",profile.removeMember);
  });
});

exports.newProcess = functions.database.ref('/teamMessages/{team}/{message}/process').onCreate(event => {
  return executeProcess(event.params.team,event.data.val()).then(result=>{
    if (result===undefined) {
      result="";
    }
    event.data.adminRef.update({
      result:result,
    });
  });
});

exports.newMessage = functions.database.ref('/teamMessages/{team}/{message}').onCreate(event => {
  const message = event.data.val();
  if (message.user!="PERRINN") {
    createTransaction (
      0.01,
      event.params.team,
      "-L6XIigvAphrJr5w2jbf",
      "PERRINN",
      "Message"
    );
  }
  admin.database().ref('PERRINNUsers/'+message.user).child('messageCount').transaction((messageCount)=>{
    if (messageCount==null) {
      return 1;
    } else {
      return messageCount+1;
    }
  });
});

exports.userCreation = functions.database.ref('/PERRINNUsers/{user}/createdTimestamp').onCreate(event => {
  createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New user:","","","",event.params.user);
});

exports.teamCreation = functions.database.ref('/PERRINNteams/{team}/createdTimestamp').onCreate(event => {
  createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New team:","","",event.params.team,"");
});

exports.teamMemberWrite = functions.database.ref('/PERRINNTeams/{team}/members/{member}').onWrite(event => {
  if (event.data.exists()) {
    admin.database().ref('PERRINNUsers/'+event.params.member).child('personalTeam').once('value').then((personalTeam)=>{
      createMessage (personalTeam.val(),"PERRINN","You are a member of:","","add",event.params.team,"");
    });
  }
  if (!event.data.exists()) {
    admin.database().ref('PERRINNUsers/'+event.params.member).child('personalTeam').once('value').then((personalTeam)=>{
      createMessage (personalTeam.val(),"PERRINN","You are not anymore a member of:","","remove",event.params.team,"");
    });
  }
});

exports.teamLeaderWrite = functions.database.ref('/PERRINNTeams/{team}/leaders/{leader}').onWrite(event => {
  if (event.data.exists()) {
    admin.database().ref('PERRINNUsers/'+event.params.leader).child('personalTeam').once('value').then((personalTeam)=>{
      createMessage (personalTeam.val(),"PERRINN","You are leader of:","","confirmation",event.params.team,"");
    });
  }
  if (!event.data.exists()) {
    admin.database().ref('PERRINNUsers/'+event.params.leader).child('personalTeam').once('value').then((personalTeam)=>{
      createMessage (personalTeam.val(),"PERRINN","You are not anymore leader of:","","remove",event.params.team,"");
    });
  }
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

exports.processImage = functions.storage.object().onChange(event=>{
  const object=event.data;
  const filePath=object.name;
  const fileName=filePath.split('/').pop();
  const fileBucket=object.bucket;
  const bucket=gcs.bucket(fileBucket);
  const tempFilePath=`/tmp/${fileName}`;
  const ref=admin.database().ref();
  const file=bucket.file(filePath);
  const thumbFilePath=filePath.replace(/(\/)?([^\/]*)$/,'$1thumb_$2');
  if (fileName.startsWith('thumb_')){
    return;
  }
  if (!object.contentType.startsWith('image/')){
    return;
  }
  if (object.resourceState==='not_exists'){
    return;
  }
  return bucket.file(filePath).download({
    destination:tempFilePath,
  }).then(()=>{
    return spawn('convert',[tempFilePath,'-thumbnail','500x500>',tempFilePath]);
  }).then(()=>{
    return bucket.upload(tempFilePath,{
      destination:thumbFilePath,
    });
  }).then(()=>{
    const thumbFile=bucket.file(thumbFilePath);
    const config={
      action:'read',
      expires:'01-01-2501'
    };
    return Promise.all([
      thumbFile.getSignedUrl(config),
      file.getSignedUrl(config)
    ]);
  }).then(results=>{
    const thumbResult=results[0];
    const originalResult=results[1];
    const thumbFileUrl=thumbResult[0];
    const fileUrl=originalResult[0];
    return admin.database().ref('PERRINNImages/'+fileName.substring(0,13)).update({
      original:fileUrl,
      thumb:thumbFileUrl,
    });
  });
});

exports.loopPhotoURL = functions.database.ref('tot').onCreate(event => {
  return admin.database().ref('PERRINNTeams/-L7jqFf8OuGlZrfEK6dT').once('value').then(team=>{
    const photoURL=team.val().photoURL;
    const image=photoURL.split('/').pop().substring(9,22);
    if (image.match(/\d{13}/)===-1){
      return;
    }
    admin.database().ref('PERRINNTeams/'+team.key).update({
      image:image,
    });
    const fileName=photoURL.split('/').pop().substring(9).split('?')[0].replace('%',' ');
    const filePath='images/'+fileName;
    const fileBucket=functions.config().firebase.storageBucket;
    const bucket=gcs.bucket(fileBucket);
    const object=bucket.file(filePath);
    const tempFilePath=`/tmp/${fileName}`;
    const ref=admin.database().ref();
    const file=bucket.file(filePath);
    const thumbFilePath=filePath.replace(/(\/)?([^\/]*)$/,'$1thumb_$2');
    if (fileName.startsWith('thumb_')){
      return;
    }
    if (!object.contentType.startsWith('image/')){
      return;
    }
    if (object.resourceState==='not_exists'){
      return;
    }
    return bucket.file(filePath).download({
      destination:tempFilePath,
    }).then(()=>{
      return spawn('convert',[tempFilePath,'-thumbnail','500x500>',tempFilePath]);
    }).then(()=>{
      return bucket.upload(tempFilePath,{
        destination:thumbFilePath,
      });
    }).then(()=>{
      const thumbFile=bucket.file(thumbFilePath);
      const config={
        action:'read',
        expires:'01-01-2501'
      };
      return Promise.all([
        thumbFile.getSignedUrl(config),
        file.getSignedUrl(config)
      ]);
    }).then(results=>{
      const thumbResult=results[0];
      const originalResult=results[1];
      const thumbFileUrl=thumbResult[0];
      const fileUrl=originalResult[0];
      return admin.database().ref('PERRINNImages/'+fileName.substring(0,13)).update({
        original:fileUrl,
        thumb:thumbFileUrl,
      });
    });
  });
});

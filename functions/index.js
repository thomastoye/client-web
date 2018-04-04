const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')({
  keyFilename:'perrinn-d5fc1-firebase-adminsdk-rh8x2-b26a8ffeef.json',
});
const spawn = require('child-process-promise').spawn;
const admin = require('firebase-admin');
admin.initializeApp();
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

function subscribeList (user,team,ref,list) {
  if (ref=="imageTeams/"){
    key=team;
  }
  if (ref=="imageUsers/"){
    key=user;
  }
  if (!ref||!list) {
    return "not enough information";
  }
  return admin.database().ref(ref).child(list).update({
    [key]:true,
  }).then(()=>{
    return "done";
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
  return admin.database().ref('PERRINNUsers/'+user).once('value').then(userData=>{
    return admin.database().ref('PERRINNUsers/'+linkUser).once('value').then(linkUserData=>{
      return admin.database().ref('PERRINNTeams/'+linkTeam).once('value').then(linkTeamData=>{
        return admin.database().ref('PERRINNImages/'+userData.val().image).once('value').then(imageData=>{
          return admin.database().ref('teamMessages/'+team).push({
            timestamp:now,
            text:text,
            user:user,
            firstName:userData.val().firstName,
            imageUrlThumbUser:imageData.val().imageUrlThumb,
            image:image,
            action:action,
            linkTeam:linkTeam,
            linkTeamName:linkTeamData.val().name?linkTeamData.val().name:'',
            linkTeamImageUrlThumb:linkTeamData.val().imageUrlThumb?linkTeamData.val().imageUrlThumb:'',
            linkUser:linkUser,
            linkUserFirstName:linkUserData.val().firstName?linkUserData.val().firstName:'',
            linkUserLastName:linkUserData.val().lastName?linkUserData.val().lastName:'',
            linkUserImageUrlThumb:linkUserData.val().imageUrlThumb?linkUserData.val().imageUrlThumb:'',
          });
        });
      });
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

function createTeam(user,team,name,image) {
  const now = Date.now();
  return updateKeyValue (user,team,'PERRINNTeams/'+team,"createdTimestamp",now).then(()=>{
    updateKeyValue (user,team,'PERRINNTeams/'+team,"name",name);
    updateKeyValue (user,team,'PERRINNTeams/'+team,"image",image);
    addListKeyValue(user,team,'PERRINNTeams/'+team,"leaders",user,true,2);
    admin.database().ref('userTeams/'+user+'/'+team).update({
      lastChatVisitTimestamp:now,
      lastChatVisitTimestampNegative:-1*now,
    });
    return team;
  });
}

function createUser(user,team,firstName,lastName,image) {
  const now = Date.now();
  return updateKeyValue (user,team,'PERRINNUsers/',"createdTimestamp",now).then(()=>{
    updateKeyValue (user,team,'PERRINNUsers/',"firstName",firstName);
    updateKeyValue (user,team,'PERRINNUsers/',"lastName",lastName);
    updateKeyValue (user,team,'PERRINNUsers/',"image",image);
    return user;
  });
}

function executeProcess(team,process){
  return admin.database().ref('appSettings/PERRINNServices/'+process.service+'/process/'+process.step).once('value').then(processStep=>{
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
    if (processStep.val().subscribeList) {
      return subscribeList (
        process.user,
        team,
        processStep.child('subscribeList').val().ref,
        process.inputs[processStep.child('subscribeList').val().list]
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
        process.inputs.image
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

exports.createPERRINNTransactionOnPaymentComplete = functions.database.ref('/teamPayments/{user}/{chargeID}/response/outcome').onCreate((data,context)=>{
  const val = data.val();
  if (val.seller_message=="Payment complete.") {
    return admin.database().ref('teamPayments/'+context.params.user+'/'+context.params.chargeID).once('value').then(payment=>{
      return createTransaction (payment.val().amountCOINSPurchased, "-KptHjRmuHZGsubRJTWJ", payment.val().team, "PERRINN", "Payment reference: "+context.params.chargeID).then((result)=>{
        if (result) {
          return admin.database().ref('teamPayments/'+context.params.user+'/'+context.params.chargeID+'/PERRINNTransaction').update({
            message: "COINS have been transfered to your team wallet."
          });
        }
      });
    });
  }
});

exports.updateProjectLeader = functions.database.ref('/projectTeams').onWrite((data,context)=>{
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

exports.newStripeCharge = functions.database.ref('/teamPayments/{user}/{chargeID}').onCreate((data,context)=>{
  const val = data.val();
  if (val === null || val.id || val.error) return null;
  const amount = val.amountCharge;
  const currency = val.currency;
  const source = val.source;
  const idempotency_key = context.params.id;
  let charge = {amount, currency, source};
  return stripe.charges.create(charge, {idempotency_key})
  .then(response=>{
    return data.ref.child('response').set(response);
  }, error=>{
    data.ref.child('error').update({type: error.type});
    return data.ref.child('error').update({message: error.message});
  });
});

exports.newUserProfile = functions.database.ref('/users/{user}/{editID}').onCreate((data,context)=>{
  const profile = data.val();
  return admin.database().ref('PERRINNUsers/'+context.params.user).once('value').then((currentProfile)=>{
    if (currentProfile.val()==null) {
      admin.database().ref('PERRINNUsers/'+context.params.user).update({
        createdTimestamp:admin.database.ServerValue.TIMESTAMP,
      });
    }
    if (profile.firstName) updateKeyValue(context.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+context.params.user,"firstName",profile.firstName);
    if (profile.lastName) updateKeyValue(context.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+context.params.user,"lastName",profile.lastName);
    if (profile.image) updateKeyValue(context.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+context.params.user,"image",profile.image);
    if (profile.personalTeam) updateKeyValue(context.params.user,'-L7jqFf8OuGlZrfEK6dT','PERRINNUsers/'+context.params.user,"personalTeam",profile.personalTeam);
  });
});

exports.newTeamProfile = functions.database.ref('/teams/{team}/{editID}').onCreate((data,context)=>{
  const profile = data.val();
  return admin.database().ref('PERRINNTeams/'+context.params.team).once('value').then((currentProfile)=>{
    if (currentProfile.val()==null) {
      admin.database().ref('PERRINNTeams/'+context.params.team).update({
        createdTimestamp:admin.database.ServerValue.TIMESTAMP,
      });
    }
    if(profile.name) updateKeyValue("",context.params.team,'PERRINNTeams/'+context.params.team,"name",profile.name);
    if(profile.image) updateKeyValue("",context.params.team,'PERRINNTeams/'+context.params.team,"image",profile.image);
    if(profile.addLeader) addListKeyValue("",context.params.team,'PERRINNTeams/'+context.params.team,"leaders",profile.addLeader,true,2);
    if(profile.addMember) addListKeyValue("",context.params.team,'PERRINNTeams/'+context.params.team,"members",profile.addMember,true,6);
    if(profile.removeMember) removeListKey("",context.params.team,'PERRINNTeams/'+context.params.team,"members",profile.removeMember);
  });
});

exports.newProcess = functions.database.ref('/teamMessages/{team}/{message}/process').onCreate((data,context)=>{
  return executeProcess(context.params.team,data.val()).then(result=>{
    if (result===undefined) {
      result="undefined";
    }
    data.ref.update({
      result:result,
    });
  });
});

exports.newMessage = functions.database.ref('/teamMessages/{team}/{message}').onCreate((data,context)=>{
  const message = data.val();
  if (message.user!="PERRINN") {
    createTransaction (
      0.01,
      context.params.team,
      "-L6XIigvAphrJr5w2jbf",
      "PERRINN",
      "Message"
    );
  }
  return admin.database().ref('PERRINNTeams/'+context.params.team).update({
    lastMessageTimestamp:message.timestamp,
    lastMessageFirstName:message.firstName,
    lastMessageText:message.text,
  }).then(()=>{
    return admin.database().ref('PERRINNUsers/'+message.user).child('messageCount').transaction((messageCount)=>{
      if (messageCount==null) {
        return 1;
      } else {
        return messageCount+1;
      }
    });
  });
});

exports.userCreation = functions.database.ref('/PERRINNUsers/{user}/createdTimestamp').onCreate((data,context)=>{
  return createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New user:","","","",context.params.user);
});

exports.teamCreation = functions.database.ref('/PERRINNTeams/{team}/createdTimestamp').onCreate((data,context)=>{
  return createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New team:","","",context.params.team,"");
});

exports.returnCOINS = functions.database.ref('tot').onCreate((data,context)=>{
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

exports.processImage = functions.storage.object().onFinalize((data,context)=>{
  const object=data;
  const filePath=object.name;
  const fileName=filePath.split('/').pop();
  const imageID=fileName.substring(0,13);
  const fileBucket=object.bucket;
  const bucket=gcs.bucket(fileBucket);
  const tempFilePath=`/tmp/${fileName}`;
  const tempFilePath2=`/tmp/2${fileName}`;
  const ref=admin.database().ref();
  const file=bucket.file(filePath);
  const originalFilePath=filePath.replace(/(\/)?([^\/]*)$/,'$1original_$2');
  const mediumFilePath=filePath.replace(/(\/)?([^\/]*)$/,'$1medium_$2');
  const thumbFilePath=filePath.replace(/(\/)?([^\/]*)$/,'$1thumb_$2');
  if (fileName.startsWith('thumb_')||fileName.startsWith('original_')||fileName.startsWith('medium_')){
    return 0;
  }
  if (!object.contentType.startsWith('image/')){
    return 0;
  }
  if (object.resourceState==='not_exists'){
    return 0;
  }
  return bucket.file(filePath).download({
    destination:tempFilePath,
  }).then(()=>{
    return spawn('identify', ['-verbose', tempFilePath], {capture: ['stdout', 'stderr']});
  }).then(result=>{
    const metadata = imageMagickOutputToObject(result.stdout);
    return admin.database().ref('PERRINNImages/'+imageID).update({
      metadata:metadata,
    });
  }).then(()=>{
    return admin.database().ref('PERRINNImages/'+imageID+'/metadata').once('value');
  }).then(metadata=>{
    if (metadata.val().Orientation=="RightTop") {
      return spawn('convert',[tempFilePath,'-rotate','90',tempFilePath]);
    } else return 0;
  }).then(()=>{
    return spawn('convert',[tempFilePath,'-strip',tempFilePath]);
  }).then(()=>{
    return bucket.upload(tempFilePath,{
      destination:originalFilePath,
    });
  }).then(()=>{
    return spawn('convert',[tempFilePath,'-thumbnail','540x540>',tempFilePath2]);
  }).then(()=>{
    return bucket.upload(tempFilePath2,{
      destination:mediumFilePath,
    });
  }).then(()=>{
    return spawn('convert',[tempFilePath,'-thumbnail','180x180>',tempFilePath]);
  }).then(()=>{
    return bucket.upload(tempFilePath,{
      destination:thumbFilePath,
    });
  }).then(()=>{
    const originalFile=bucket.file(originalFilePath);
    const mediumFile=bucket.file(mediumFilePath);
    const thumbFile=bucket.file(thumbFilePath);
    const config={
      action:'read',
      expires:'01-01-2501'
    };
    return Promise.all([
      originalFile.getSignedUrl(config),
      mediumFile.getSignedUrl(config),
      thumbFile.getSignedUrl(config)
    ]);
  }).then(results=>{
    const originalResult=results[0];
    const mediumResult=results[1];
    const thumbResult=results[2];
    const originalFileUrl=originalResult[0];
    const mediumFileUrl=mediumResult[0];
    const thumbFileUrl=thumbResult[0];
    return admin.database().ref('PERRINNImages/'+imageID).update({
      imageUrlOriginal:originalFileUrl,
      imageUrlMedium:mediumFileUrl,
      imageUrlThumb:thumbFileUrl,
    });
  }).then(()=>{
    return 1;
  }).catch(error=>{
    console.log("error image processing: "+error);
    return 0;
  });
});

/**
 * Convert the output of ImageMagick's `identify -verbose` command to a JavaScript Object.
 */
function imageMagickOutputToObject(output) {
  let previousLineIndent = 0;
  const lines = output.match(/[^\r\n]+/g);
  lines.shift(); // Remove First line
  lines.forEach((line, index)=>{
    const currentIdent = line.search(/\S/);
    line = line.trim();
    if (line.endsWith(':')) {
      lines[index] = makeKeyFirebaseCompatible(`"${line.replace(':', '":{')}`);
    } else {
      const split = line.replace('"', '\\"').split(': ');
      split[0] = makeKeyFirebaseCompatible(split[0]);
      lines[index] = `"${split.join('":"')}",`;
    }
    if (currentIdent < previousLineIndent) {
      lines[index - 1] = lines[index - 1].substring(0, lines[index - 1].length - 1);
      lines[index] = new Array(1 + (previousLineIndent - currentIdent) / 2).join('}') + ',' + lines[index];
    }
    previousLineIndent = currentIdent;
  });
  output = lines.join('');
  output = '{' + output.substring(0, output.length - 1) + '}'; // remove trailing comma.
  output = JSON.parse(output);
  return output;
}

/**
 * Makes sure the given string does not contain characters that can't be used as Firebase
 * Realtime Database keys such as '.' and replaces them by '*'.
 */
function makeKeyFirebaseCompatible(key) {
  return key.replace(/\./g, '*');
}

exports.loopProjects = functions.database.ref('tot').onCreate((data,context)=>{
  return admin.database().ref('appSettings/photoLibrary/').once('value').then(photos=>{
    photos.forEach(photo=>{
      copyPhotoURL(photo);
    });
  });
});

function copyPhotoURL(photo){
  const photoURL=photo.val().photoURL;
  if (photoURL!==undefined) {
    const image=photoURL.split('/').pop().substring(9,22);
    if (image.match(/\d{13}/g)===null){
    } else {
      console.log("processing: "+image);
      admin.database().ref('appSettings/photoLibrary/'+photo.key).update({
        image:image,
      });
      const fileName=photoURL.split('/').pop().substring(9).split('?')[0].replace(/[%]20/g,' ');
      const fileNameCopy=fileName.split('.')[0]+'copy'+'.'+fileName.split('.')[1]
      const filePath='images/'+fileName;
      const filePathCopy='images/'+fileNameCopy;
      const fileBucket=process.env.FIREBASE_CONFIG.storageBucket;
      const bucket=gcs.bucket(fileBucket);
      const object=bucket.file(filePath);
      return object.copy(bucket.file(filePathCopy)).then(()=>{
        return 1;
      }).catch(error=>{
        return error;
      });
    }
  }
}

exports.updateMessageMissingFirstName = functions.database.ref('tot').onCreate((data,context)=>{
  let teamKeys=[];
  let messageKeys=[];
  const maxIter=1000;
  let iter=0;
  return admin.database().ref('teamMessages/').once('value').then(teams=>{
    let firstNames=[];
    teams.forEach(team=>{
      team.forEach(message=>{
        if (message.val().firstName==undefined&&iter<maxIter) {
          teamKeys.push(team.key);
          messageKeys.push(message.key);
          firstNames.push(admin.database().ref('PERRINNUsers/'+message.val().user).child('firstName').once('value'));
        }
      });
    });
    return Promise.all(firstNames);
  }).then(firstNames=>{
    let updateObj={};
    console.log('number of items:'+firstNames.length);
    for(i=0;i<firstNames.length;i++) {
      if (firstNames[i]!=undefined&&i<maxIter) {
        if (firstNames[i].val()!=null) {
          updateObj[`teamMessages/${teamKeys[i]}/${messageKeys[i]}/firstName`]=firstNames[i].val();
          iter+=1;
        }
      }
    }
    console.log('number of updates:'+iter);
    console.log(updateObj);
    return admin.database().ref().update(updateObj);
  }).then(()=>{
    console.log('all done.');
    return iter;
  }).catch(error=>{
    console.log(error);
  });
});

exports.updateUserTeamsMissingData = functions.database.ref('tot').onCreate((data,context)=>{
  let userKeys=[];
  let teamKeys=[];
  let keys=[];
  const maxIter=1000;
  let iter=0;
  return admin.database().ref('userTeams/').once('value').then(users=>{
    let values=[];
    users.forEach(user=>{
      user.forEach(team=>{
        if (team.val().name==undefined) {
          userKeys.push(user.key);
          teamKeys.push(team.key);
          keys.push('name');
          values.push(admin.database().ref('PERRINNTeams/'+team.key).child('name').once('value'));
        }
        if (team.val().balance==undefined) {
          userKeys.push(user.key);
          teamKeys.push(team.key);
          keys.push('balance');
          values.push(admin.database().ref('PERRINNTeamBalance/'+team.key).child('balance').once('value'));
        }
        if (team.val().lastMessageFirstName==undefined) {
          userKeys.push(user.key);
          teamKeys.push(team.key);
          keys.push('lastMessageFirstName');
          values.push(admin.database().ref('PERRINNUsers/'+team.val().lastMessageUser).child('firstName').once('value'));
        }
        if (team.val().imageUrlThumb==undefined) {
          userKeys.push(user.key);
          teamKeys.push(team.key);
          keys.push('imageUrlThumb');
          values.push(admin.database().ref('PERRINNTeams/'+team.key).child('imageUrlThumb').once('value'));
        }
      });
    });
    return Promise.all(values);
  }).then(values=>{
    let updateObj={};
    console.log('number of items:'+values.length);
    for(i=0;i<values.length;i++) {
      if (values[i]!=undefined&&i<maxIter) {
        if (values[i].val()!=null) {
          updateObj[`userTeams/${userKeys[i]}/${teamKeys[i]}/${keys[i]}`]=values[i].val();
          iter+=1;
        }
      }
    }
    console.log('number of updates:'+iter);
    console.log(updateObj);
    return admin.database().ref().update(updateObj);
  }).then(()=>{
    console.log('all done.');
    return iter;
  }).catch(error=>{
    console.log(error);
  });
});

exports.updateTeamsMissingData = functions.database.ref('tot').onCreate((data,context)=>{
  let teamKeys=[];
  let keys=[];
  const maxIter=1000;
  let iter=0;
  return admin.database().ref('PERRINNTeams/').once('value').then(teams=>{
    let values=[];
    teams.forEach(team=>{
      if (team.val().imageUrlThumb==undefined&&team.val().image!=undefined) {
        teamKeys.push(team.key);
        keys.push('imageUrlThumb');
        values.push(admin.database().ref('PERRINNImages/'+team.val().image.replace(/[\\/:"*?<>|\.#=]/g,'')).child('imageUrlThumb').once('value'));
      }
    });
    return Promise.all(values);
  }).then(values=>{
    let updateObj={};
    console.log('number of items:'+values.length);
    for(i=0;i<values.length;i++) {
      if (values[i]!=undefined&&i<maxIter) {
        if (values[i].val()!=null) {
          updateObj[`PERRINNTeams/${teamKeys[i]}/${keys[i]}`]=values[i].val();
          iter+=1;
        }
      }
    }
    console.log('number of updates:'+iter);
    console.log(updateObj);
    return admin.database().ref().update(updateObj);
  }).then(()=>{
    console.log('all done.');
    return iter;
  }).catch(error=>{
    console.log(error);
  });
});

exports.updateUsersMissingData = functions.database.ref('tot').onCreate((data,context)=>{
  let userKeys=[];
  let keys=[];
  const maxIter=1000;
  let iter=0;
  return admin.database().ref('PERRINNUsers/').once('value').then(users=>{
    let values=[];
    users.forEach(user=>{
      if (user.val().imageUrlThumb==undefined&&user.val().image!=undefined) {
        userKeys.push(user.key);
        keys.push('imageUrlThumb');
        values.push(admin.database().ref('PERRINNImages/'+user.val().image.replace(/[\\/:"*?<>|\.#=]/g,'')).child('imageUrlThumb').once('value'));
      }
    });
    return Promise.all(values);
  }).then(values=>{
    let updateObj={};
    console.log('number of items:'+values.length);
    for(i=0;i<values.length;i++) {
      if (values[i]!=undefined&&i<maxIter) {
        if (values[i].val()!=null) {
          updateObj[`PERRINNUsers/${userKeys[i]}/${keys[i]}`]=values[i].val();
          iter+=1;
        }
      }
    }
    console.log('number of updates:'+iter);
    console.log(updateObj);
    return admin.database().ref().update(updateObj);
  }).then(()=>{
    console.log('all done.');
    return iter;
  }).catch(error=>{
    console.log(error);
  });
});

exports.loopUserTeamsRemoveUnfollow = functions.database.ref('toto').onCreate((data,context)=>{
  return admin.database().ref('userTeams').once('value').then(userTeams=>{
    userTeams.forEach(user=>{
      user.forEach(team=>{
        if (team.val().following===false) {
          admin.database().ref('userTeams/'+user.key+'/'+team.key).remove();
        }
      });
    });
  });
});

exports.populateTeamUsers=functions.database.ref('toto').onCreate((data,context)=>{
  return admin.database().ref('userTeams/').once('value').then(userTeams=>{
    userTeams.forEach(user=>{
      user.forEach(team=>{
        admin.database().ref('teamUsers/'+team.key).update({
          [user.key]:true,
        });
      });
    });
  });
});

exports.populateImageTeams=functions.database.ref('toto').onCreate((data,context)=>{
  return admin.database().ref('PERRINNTeams/').once('value').then(teams=>{
    teams.forEach(team=>{
      if (team.val().image!=undefined) {
        admin.database().ref('imageTeams/'+team.val().image.replace(/[\\/:"*?<>|\.#=]/g,'')).update({
          [team.key]:true,
        });
      }
    });
  });
});

exports.populateImageUsers=functions.database.ref('toto').onCreate((data,context)=>{
  return admin.database().ref('PERRINNUsers/').once('value').then(users=>{
    users.forEach(user=>{
      if (user.val().image!=undefined) {
        admin.database().ref('imageUsers/'+user.val().image.replace(/[\\/:"*?<>|\.#=]/g,'')).update({
          [user.key]:true,
        });
      }
    });
  });
});

function newValidData(key,beforeData,afterData){
  var isNewValidData=false;
  if (afterData[key]!=undefined){
    if(beforeData[key]==undefined)isNewValidData=true;
    if(beforeData[key]!=afterData[key])isNewValidData=true;
  }
  return isNewValidData;
}

exports.fanoutTeam=functions.database.ref('/PERRINNTeams/{team}').onWrite((data,context)=>{
  const beforeData = data.before.val();
  const afterData = data.after.val();
  var keys=['lastMessageTimestamp','lastMessageFirstName','lastMessageText','name','imageUrlThumb'];
  var updateKeys=[];
  keys.forEach(key=>{
    if(newValidData(key,beforeData,afterData))updateKeys.push(key);
  });
  return admin.database().ref('/teamUsers/'+context.params.team).once('value').then(users=>{
    let updateObj={};
    users.forEach(user=>{
      updateKeys.forEach(updateKey=>{
        updateObj['userTeams/'+user.key+'/'+context.params.team+'/'+updateKey]=afterData[updateKey];
      });
    });
    return admin.database().ref().update(updateObj);
  });
});

exports.fanoutImage=functions.database.ref('/PERRINNImages/{image}').onWrite((data,context)=>{
  const beforeData = data.before.val();
  const afterData = data.after.val();
  var keys=['imageUrlThumb','imageUrlMedium','imageUrlOriginal'];
  var updateKeys=[];
  keys.forEach(key=>{
    if(newValidData(key,beforeData,afterData))updateKeys.push(key);
  });
  return admin.database().ref('/imageUsers/'+context.params.image).once('value').then(users=>{
    return admin.database().ref('/imageTeams/'+context.params.image).once('value').then(teams=>{
      let updateObj={};
      users.forEach(user=>{
        updateKeys.forEach(updateKey=>{
          updateObj['PERRINNUsers/'+user.key+'/'+updateKey]=afterData[updateKey];
        });
      });
      teams.forEach(team=>{
        updateKeys.forEach(updateKey=>{
          updateObj['PERRINNTeams/'+team.key+'/'+updateKey]=afterData[updateKey];
        });
      });
      return admin.database().ref().update(updateObj);
    });
  });
});

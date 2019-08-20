const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')({
  keyFilename:'perrinn-d5fc1-firebase-adminsdk-rh8x2-b26a8ffeef.json',
});
const spawn = require('child-process-promise').spawn;
const admin = require('firebase-admin');
admin.initializeApp();
var u = require('url');
var crypto = require('crypto');
var request = require('request-promise');

const {google} = require('googleapis');

function updateKeyValue (user,team,ref,key,value) {
  return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
    if (ref=="PERRINNTeams/"){
      ref=ref+team;
    }
    return admin.database().ref(ref).child(key).once('value').then((currentValue)=>{
      if (ref==null||key==null||value==null) {
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
    console.log(error);
    return error;
  });
}

function addListKeyValue (user,team,ref,list,key,value,maxCount) {
  return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
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
      return getTeamName(key).then(teamName=>{
        if(list=="leaders"||list=="members"){
            value={name:teamName};
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
    });
  }).catch(error=>{
    console.log('addListKeyValue: '+error);
    return error;
  });
}

function subscribeList (user,team,ref,list) {
  if (ref=="subscribeImageTeams/"){
    key=team;
  }
  if (!ref||!list) {
    return "not enough information";
  }
  return admin.database().ref(ref).child(list).update({
    [key]:true,
  }).then(()=>{
    return "done";
  }).catch(error=>{
    console.log(error);
    return error;
  });
}

function removeListKey (user,team,ref,list,key) {
  return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
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
    console.log(error);
    return error;
  });
}

function createMessage (team,user,text,image,action,linkTeam,linkUser,donor,donorMessage,process) {
  const now=Date.now();
  return admin.database().ref('PERRINNTeams/'+user).once('value').then(userData=>{
    return admin.database().ref('PERRINNTeams/'+linkUser).once('value').then(linkUserData=>{
      return admin.database().ref('PERRINNTeams/'+linkTeam).once('value').then(linkTeamData=>{
        return admin.database().ref('teamMessages/'+team).push({
          payload:{
            timestamp:now,
            text:text,
            user:user,
            name:userData.val().name,
            imageUrlThumbUser:userData.val().imageUrlThumb,
            image:image,
            action:action,
            linkTeam:linkTeam,
            linkTeamName:linkTeamData.val().name?linkTeamData.val().name:'',
            linkTeamImageUrlThumb:linkTeamData.val().imageUrlThumb?linkTeamData.val().imageUrlThumb:'',
            linkUser:linkUser,
            linkUserName:linkUserData.val().name?linkUserData.val().name:'',
            linkuserFamilyName:linkUserData.val().familyName?linkUserData.val().familyName:'',
            linkUserImageUrlThumb:linkUserData.val().imageUrlThumb?linkUserData.val().imageUrlThumb:'',
          },
          PERRINN:{transactionIn:{donor:donor,donorMessage:donorMessage}},
          process:process,
        });
      });
    });
  });
}

function createTeam(team,user,name,familyName,parent) {
  const now=Date.now();
  let updateObj={};
  updateObj['PERRINNTeams/'+team+'/createdTimestamp']=now;
  updateObj['PERRINNTeams/'+team+'/name']=name;
  updateObj['PERRINNTeams/'+team+'/familyName']=familyName;
  updateObj['PERRINNTeams/'+team+'/leaders/'+user]={name:name};
  updateObj['PERRINNTeams/'+team+'/leadersCount']=1;
  updateObj['PERRINNTeams/'+team+'/lastMessageTimestamp']=now;
  updateObj['PERRINNTeams/'+team+'/lastMessageTimestampNegative']=-1*now;
  if(parent!=''){
    updateObj['PERRINNTeams/'+team+'/parent']=parent;
    updateObj['PERRINNTeams/'+parent+'/children/'+team]=true;
    updateObj['PERRINNTeams/'+parent+'/childrenCount']=1;
  }
  updateObj['subscribeTeamUsers/'+team+'/'+user]=true;
  return admin.database().ref().update(updateObj).then(()=>{
    var batch = admin.firestore().batch();
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{createdTimestamp:now},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{name:name},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{familyName:familyName},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{leaders:{[user]:{name:name}}},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{leadersCount:1},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+team),{lastMessageTimestamp:now},{create:true});
    if(parent!=''){
      batch.update(admin.firestore().doc('PERRINNTeams/'+team),{parent:parent},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+parent),{children:{[team]:{name:name}}},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+parent),{childrenCount:1},{create:true});
    }
    batch.update(admin.firestore().doc('PERRINNTeams/'+user+'/viewTeams/'+team),{lastChatVisitTimestamp:now},{create:true});
    batch.update(admin.firestore().doc('PERRINNTeams/'+user+'/viewTeams/'+team),{name:name},{create:true});
    return batch.commit().then(()=>{
      return 'done';
    });
  });
}

function executeProcess(user,team,functionObj,inputs){
  return admin.database().ref('undefined').once('value').then(()=>{
    if (functionObj.name=='updateKeyValue') {
      var value;
      if(functionObj.value!=undefined)value=functionObj.value;
      else value=inputs.value;
      return updateKeyValue (
        user,
        team,
        functionObj.ref,
        functionObj.key,
        value
      ).then(result=>{
        return result;
      });
    }
    if (functionObj.name=='addListKeyValue') {
      return addListKeyValue (
        user,
        team,
        functionObj.ref,
        functionObj.list,
        inputs.key,
        true,
        functionObj.maxCount
      ).then(result=>{
        return result;
      });
    }
    if (functionObj.name=='subscribeList') {
      return subscribeList (
        user,
        team,
        functionObj.ref,
        inputs.list
      ).then(result=>{
        return result;
      });
    }
    if (functionObj.name=='removeListKey') {
      return removeListKey (
        user,
        team,
        functionObj.ref,
        functionObj.list,
        inputs.key
      ).then(result=>{
        return result;
      });
    }
    if (functionObj.name=='createTeam') {
      var newID=admin.database().ref('ids/').push(true).key;
      return createTeam (
        newID,
        user,
        inputs.name,
        "",
        team
      ).then(result=>{
        return result;
      });
    }
    if (functionObj.name=='joinOnshapePERRINNTeam') {
      return joinOnshapePERRINNTeam (
        user
      ).then(result=>{
        return result;
      });
    }
    if (functionObj.name=='joinPERRINNGoogleGroup') {
      return joinPERRINNGoogleGroup (
        user
      ).then(result=>{
        return result;
      });
    }
    return 'none';
  }).catch(error=>{
    console.log('executeProcess: '+error);
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

exports.newStripeCharge = functions.database.ref('/teamPayments/{user}/{chargeID}').onCreate((data,context)=>{
  const stripeObj = require('stripe')(functions.config().stripe.token);
  const val = data.val();
  if (val === null || val.id || val.error) return null;
  const amount = val.amountCharge;
  const currency = val.currency;
  const source = val.source;
  const idempotency_key = context.params.id;
  let charge = {amount, currency, source};
  return stripeObj.charges.create(charge, {idempotency_key})
  .then(response=>{
    return data.ref.child('response').set(response);
  }, error=>{
    data.ref.child('error').update({type: error.type});
    return data.ref.child('error').update({message: error.message});
  });
});

exports.newUserProfile = functions.database.ref('/users/{user}/{editID}').onCreate((data,context)=>{
  const now=Date.now();
  return createTeam(context.params.user,context.params.user,data.val().name,data.val().familyName,"").then(()=>{
    return 'done';
  });
});

function writeMessageChainData(team,message){
  return admin.database().ref('PERRINNTeamMessageChain/'+team).child('lock').transaction(function(lock){
    if(lock===null)return true;
    else return;
  }).then(result=>{
    if (result.committed){
      return admin.database().ref('PERRINNTeamMessageChain/'+team).once('value').then(messageChain=>{
        let updateObj={};
        let previousMessage='none';
        let index=1;
        if (messageChain.val()!=undefined&&messageChain.val()!=null){
          previousMessage=messageChain.val().previousMessage?messageChain.val().previousMessage:'none';
          index=messageChain.val().previousIndex?Number(messageChain.val().previousIndex)+1:1;
        }
        updateObj['teamMessages/'+team+'/'+message+'/PERRINN/chain/previousMessage']=previousMessage;
        updateObj['teamMessages/'+team+'/'+message+'/PERRINN/chain/nextMessage']='none';
        updateObj['teamMessages/'+team+'/'+message+'/PERRINN/chain/index']=index;
        updateObj['teamMessages/'+team+'/'+message+'/PERRINN/chain/timestamp']=admin.database.ServerValue.TIMESTAMP;
        return admin.database().ref().update(updateObj).then(()=>{
          return 'done';
        });
      });
    }
  }).catch(error=>{
    console.log(error);
  });
}

function writeMessagingCostData(user,team,message){
  let updateObj={};
  let amount=0;
  let amountRead=0;
  let amountWrite=0;
  let receiver='none';
  let reference='none';
  return admin.database().ref('PERRINNTeamMessageReads/'+team).once('value').then(PERRINNTeamMessageReads=>{
    return admin.database().ref('appSettings/messageTemplate/messagingCost').once('value').then(messagingCost=>{
      if(user!='PERRINN'){
        amountWrite=messagingCost.val().amount;
        receiver=messagingCost.val().receiver;
        reference=messagingCost.val().reference;
      }
      if(PERRINNTeamMessageReads!=undefined&&PERRINNTeamMessageReads!=null){
        if(PERRINNTeamMessageReads.val().amountOutstanding!=undefined)amountRead=PERRINNTeamMessageReads.val().amountOutstanding;
      }
      amount=Math.round((Number(amountRead)+Number(amountWrite))*100000)/100000;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/amount']=amount;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/amountRead']=amountRead;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/amountWrite']=amountWrite;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/receiver']=receiver;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/reference']=reference;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/timestamp']=admin.database.ServerValue.TIMESTAMP;
      return admin.database().ref().update(updateObj).then(()=>{
        return admin.database().ref('PERRINNTeamMessageReads/'+team).child('amountOutstanding').transaction(function(amountOutstanding){
          if(amountOutstanding===null)return 0;
          else return Math.round((Number(amountOutstanding)-Number(amountRead))*100000)/100000;
        }).then(()=>{
          return 'done';
        });
      });
    });
  }).catch(error=>{
    console.log(error);
  });
}

function writeMessageTeamData(team,message){
  return admin.database().ref('teamMessages/'+team+'/'+message).once('value').then(messageObj=>{
    return admin.database().ref('PERRINNTeams/'+team).update({
      lastMessageTimestamp:messageObj.val().payload.timestamp,
      lastMessageTimestampNegative:-messageObj.val().payload.timestamp,
      lastMessageName:messageObj.val().payload.name,
      lastMessageText:messageObj.val().payload.text,
      lastMessageBalance:messageObj.val().PERRINN.wallet.balance,
    }).then(()=>{
      return admin.firestore().doc('PERRINNTeams/'+team).update({
        lastMessageTimestamp:messageObj.val().payload.timestamp,
        lastMessageName:messageObj.val().payload.name,
        lastMessageText:messageObj.val().payload.text,
        lastMessageBalance:messageObj.val().PERRINN.wallet.balance,
      }).then(()=>{
        return 'done';
      });
    });
  }).catch(error=>{
    console.log(error);
  });
}

function incrementUserMessageCounter(user){
  var transactionDoc=admin.firestore().doc('PERRINNTeams/'+user);
  return admin.firestore().runTransaction(transaction=>{
    return transaction.get(transactionDoc).then(doc=>{
      transaction.update(transactionDoc,{messageCount:doc.data().messageCount+1});
    });
  }).then(()=>{
    return 'done';
  }).catch(error=>{
    console.log(error);
  });
}

function checkTransactionInputs(team,inputs){
  if(inputs.amount>0&&inputs.amount<=100000){
    if(inputs.receiver!=team){
      if(inputs.reference!=''){
        return true;
      }
    }
  }
  return false;
}

function getTeamName(team){
  return admin.database().ref('PERRINNTeams/'+team+'/name').once('value').then(name=>{
    if(name.val()==undefined||name.val()==null)return '';
    else return name.val();
  });
}

function getTeamImageUrlThumb(team){
  return admin.database().ref('PERRINNTeams/'+team+'/imageUrlThumb').once('value').then(imageUrlThumb=>{
    if(imageUrlThumb.val()==undefined||imageUrlThumb.val()==null)return '';
    else return imageUrlThumb.val();
  });
}

function writeMessageProcessData(team,message){
  return admin.database().ref('teamMessages/'+team+'/'+message+'/process').once('value').then(process=>{
    let updateObj={};
    let regex='none';
    let user='';
    let functionObj={none:'none'};
    let inputs={none:'none'};
    let inputsComplete=false;
    if(process.val()!=undefined&&process.val()!=null){
      if(process.val().inputsComplete){
        regex=process.val().regex;
        user=process.val().user;
        functionObj=process.val().function;
        inputs=process.val().inputs;
        inputsComplete=process.val().inputsComplete;
      }
    }
    return executeProcess(user,team,functionObj,inputs).then(result=>{
      if (result==undefined) result='undefined';
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/process/regex']=regex;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/process/function']=functionObj;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/process/inputs']=inputs;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/process/inputsComplete']=inputsComplete;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/process/result']=result;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/process/timestamp']=admin.database.ServerValue.TIMESTAMP;
      return admin.database().ref().update(updateObj).then(()=>{
        return 'done';
      });
    });
  }).catch(error=>{
    console.log('writeMessageProcessData: '+error);
  });
}

function writeMessageTransactionOutData(team,message,process){
  let updateObj={};
  let amount=0;
  let receiver='none';
  let receiverMessage='none';
  let reference='none';
  let inputCheck=false;
  if(process!=undefined&&process!=null){
    if(process.service=='transactionStart'){
      if(checkTransactionInputs(team,process.inputs)) {
        amount=process.inputs.amount;
        receiver=process.inputs.receiver;
        reference=process.inputs.reference;
        inputCheck=true;
      }
    }
  }
  return getTeamName(receiver).then(receiverName=>{
    return getTeamImageUrlThumb(receiver).then(receiverImageUrlThumb=>{
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/amount']=amount;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/receiver']=receiver;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/receiverName']=receiverName;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/receiverImageUrlThumb']=receiverImageUrlThumb;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/receiverMessage']=receiverMessage;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/reference']=reference;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/timestamp']=admin.database.ServerValue.TIMESTAMP;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/inputCheck']=inputCheck;
      return admin.database().ref().update(updateObj).then(()=>{
        return 'done';
      });
    });
  }).catch(error=>{
    console.log(error);
  });
}

function writeMessageTransactionInData(team,message){
  return admin.database().ref('teamMessages/'+team+'/'+message+'/PERRINN/transactionIn').once('value').then(transactionInObj=>{
    let donor='none';
    let donorMessage='none';
    if(transactionInObj.val()!=undefined&&transactionInObj.val()!=null){
      if(transactionInObj.val().donor!=undefined&&transactionInObj.val().donor!=null){
        if(transactionInObj.val().donorMessage!=undefined&&transactionInObj.val().donorMessage!=null){
          donor=transactionInObj.val().donor;
          donorMessage=transactionInObj.val().donorMessage;
        }
      }
    }
    return admin.database().ref('teamMessages/'+donor+'/'+donorMessage+'/PERRINN/transactionOut').once('value').then(donorTransactionOutObj=>{
      let updateObj={};
      let amount=0;
      let reference='none';
      let donorCheck=false;
      if(donorTransactionOutObj.val()!=undefined&&donorTransactionOutObj.val()!=null) {
        amount=donorTransactionOutObj.val().amount;
        reference=donorTransactionOutObj.val().reference;
        donorCheck=true;
      }
      return getTeamName(donor).then(donorName=>{
        return getTeamImageUrlThumb(donor).then(donorImageUrlThumb=>{
          updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/amount']=amount;
          updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/donor']=donor;
          updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/donorName']=donorName;
          updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/donorImageUrlThumb']=donorImageUrlThumb;
          updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/donorMessage']=donorMessage;
          updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/reference']=reference;
          updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/timestamp']=admin.database.ServerValue.TIMESTAMP;
          updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/donorCheck']=donorCheck;
          return admin.database().ref().update(updateObj).then(()=>{
            return 'done';
          });
        });
      });
    });
  }).catch(error=>{
    console.log(error);
  });
}

function writeMessageWalletData(team,message){
  return admin.database().ref('teamMessages/'+team+'/'+message).once('value').then(messageObj=>{
    return admin.database().ref('teamMessages/'+team+'/'+messageObj.val().PERRINN.chain.previousMessage).once('value').then(previousMessageObj=>{
      let updateObj={};
      var previousBalance=0;
      if(previousMessageObj.val()!=undefined&&previousMessageObj.val()!=null){
        if(previousMessageObj.val().PERRINN!=undefined&&previousMessageObj.val().PERRINN!=null){
          if(previousMessageObj.val().PERRINN.wallet!=undefined&&previousMessageObj.val().PERRINN.wallet!=null){
            previousBalance=previousMessageObj.val().PERRINN.wallet.balance;
          }
        }
      }
      var balance=previousBalance;
      if(messageObj.val().PERRINN.messagingCost.amount>0){
        balance=Math.round((Number(balance)-Number(messageObj.val().PERRINN.messagingCost.amount))*100000)/100000;
        updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/status']='complete';
      } else {
        updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/status']='none';
      }
      if(messageObj.val().PERRINN.transactionOut.inputCheck){
        balance=Math.round((Number(balance)-Number(messageObj.val().PERRINN.transactionOut.amount))*100000)/100000;
        updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/status']='complete';
      } else {
        updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/status']='none';
      }
      if(messageObj.val().PERRINN.transactionIn.donorCheck){
        balance=Math.round((Number(balance)+Number(messageObj.val().PERRINN.transactionIn.amount))*100000)/100000;
      }
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/wallet/previousBalance']=previousBalance;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/wallet/amount']=Math.round((balance-previousBalance)*100000)/100000;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/wallet/balance']=balance;
      updateObj['teamMessages/'+team+'/'+message+'/PERRINN/wallet/timestamp']=admin.database.ServerValue.TIMESTAMP;
      return admin.database().ref().update(updateObj).then(()=>{
        return 'done';
      });
    });
  }).catch(error=>{
    console.log(error);
  });
}

function writeMessageAtomicData(team,message){
  return admin.database().ref('teamMessages/'+team+'/'+message).once('value').then(messageObj=>{
    let updateObj={};
    let previousMessage=messageObj.val().PERRINN.chain.previousMessage;
    let index=messageObj.val().PERRINN.chain.index;
    let messagingCostProcessed=messageObj.val().PERRINN.messagingCost.status=='complete'?true:false;
    let transactionOutProcessed=messageObj.val().PERRINN.transactionOut.status=='complete'?true:false;
    let transactionInProcessed=messageObj.val().PERRINN.transactionIn.donorCheck?true:false;
    updateObj['teamMessages/'+team+'/'+message+'/PERRINN/dataWrite']='complete';
    updateObj['teamMessages/'+team+'/'+message+'/PERRINN/timestampEnd']=admin.database.ServerValue.TIMESTAMP;
    updateObj['teamMessages/'+team+'/'+message+'/PERRINN/messagingCost/processed']=messagingCostProcessed;
    updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionOut/processed']=transactionOutProcessed;
    updateObj['teamMessages/'+team+'/'+message+'/PERRINN/transactionIn/processed']=transactionInProcessed;
    if(previousMessage!='none')updateObj['teamMessages/'+team+'/'+previousMessage+'/PERRINN/chain/nextMessage']=message;
    if(transactionInProcessed)updateObj['teamMessages/'+messageObj.val().PERRINN.transactionIn.donor+'/'+messageObj.val().PERRINN.transactionIn.donorMessage+'/PERRINN/transactionOut/receiverMessage']=message;
    updateObj['PERRINNTeamMessageChain/'+team+'/previousMessage']=message;
    updateObj['PERRINNTeamMessageChain/'+team+'/previousIndex']=index;
    return admin.database().ref().update(updateObj).then(()=>{
      return 'done';
    });
  }).catch(error=>{
    console.log(error);
  });
}

function writeMessageTransactionReceiverData(team,message){
  return admin.database().ref('teamMessages/'+team+'/'+message+'/PERRINN/transactionOut').once('value').then(transactionOutObj=>{
    if(transactionOutObj.val().processed){
      return createMessage(transactionOutObj.val().receiver,"PERRINN","","","","","",team,message,{}).then(()=>{
        return 'done';
      });
    }
  }).catch(error=>{
    console.log(error);
  });
}

exports.newMessage = functions.database.ref('/teamMessages/{team}/{message}').onCreate((data,context)=>{
  const message=data.val();
  let writeError=null;
  let lockedTeamChain=false;
  return data.ref.child('/PERRINN').update({
    timestampStart:admin.database.ServerValue.TIMESTAMP,
  }).then(()=>{
    return incrementUserMessageCounter(message.payload.user);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not increment count';
      return null;
    }
    return writeMessagingCostData(message.payload.user,context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write message cost';
      return null;
    }
    return writeMessageProcessData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write process';
      return null;
    }
    return writeMessageTransactionOutData(context.params.team,context.params.message,message.process);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write transaction out';
      return null;
    }
    return writeMessageTransactionInData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write transaction in';
      return null;
    }
    return writeMessageChainData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write chain';
      return null;
    }
    lockedTeamChain=true;
    return writeMessageWalletData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write wallet';
      return null;
    }
    return writeMessageAtomicData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write atomic data';
      return null;
    }
    return writeMessageTeamData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write message data';
      return null;
    }
    return writeMessageTransactionReceiverData(context.params.team,context.params.message);
  }).then(()=>{
    if(lockedTeamChain)return admin.database().ref('PERRINNTeamMessageChain/'+context.params.team+'/lock').remove();
    return null;
  }).then(()=>{
    if(writeError) return data.ref.child('/PERRINN').update({dataWrite:writeError});
  });
});

exports.newMessageRead=functions.database.ref('teamReads/{reader}/{team}/{message}').onCreate((data,context)=>{
  let updateObj={};
  let amount=0;
  let debtor='';
  return isMemberOrLeader(context.params.reader,context.params.team).then(result=>{
    if(result)debtor=context.params.team;
    else debtor=context.params.reader;
    return admin.database().ref('appSettings/messageReadCost').once('value').then(messageReadCost=>{
      amount=messageReadCost.val().amount;
      return admin.database().ref('PERRINNTeamMessageReads/'+debtor).child('amountOutstanding').transaction(function(amountOutstanding){
        if(amountOutstanding===null)return amount;
        else return Math.round((Number(amountOutstanding)+Number(amount))*100000)/100000;
      });
    });
  }).catch(error=>{
    console.log(error);
  });
});

function isMemberOrLeader(user,team){
  return admin.database().ref('PERRINNTeams/'+team).once('value').then(teamObj=>{
    if(teamObj.child('leaders').child(user)||teamObj.child('members').child(user))return true;
    else return false;
  });
}

function fanoutImage(image,imageUrlThumb,imageUrlMedium,imageUrlOriginal){
  return admin.database().ref('/subscribeImageTeams/'+image).once('value').then(teams=>{
    let updateObj={};
    var batch = admin.firestore().batch();
    updateObj['PERRINNImages/'+image+'/imageUrlThumb']=imageUrlThumb;
    updateObj['PERRINNImages/'+image+'/imageUrlMedium']=imageUrlMedium;
    updateObj['PERRINNImages/'+image+'/imageUrlOriginal']=imageUrlOriginal;
    teams.forEach(team=>{
      updateObj['PERRINNTeams/'+team.key+'/imageUrlThumb']=imageUrlThumb;
      updateObj['PERRINNTeams/'+team.key+'/imageUrlMedium']=imageUrlMedium;
      updateObj['PERRINNTeams/'+team.key+'/imageUrlOriginal']=imageUrlOriginal;
      batch.update(admin.firestore().doc('PERRINNTeams/'+team.key),{imageUrlThumb:imageUrlThumb},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+team.key),{imageUrlMedium:imageUrlMedium},{create:true});
      batch.update(admin.firestore().doc('PERRINNTeams/'+team.key),{imageUrlOriginal:imageUrlOriginal},{create:true});
    });
    return admin.database().ref().update(updateObj).then(()=>{
      return batch.commit().then(()=>{
        return admin.database().ref('/subscribeImageTeams/'+image).remove();
      });
    });
  });
}

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
  }).catch(error=>{
    console.log("error retrieving metadata: "+error);
    return 0;
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
    return fanoutImage(imageID,thumbFileUrl,mediumFileUrl,originalFileUrl);
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

function newValidData(key,beforeData,afterData){
  if(afterData[key]==undefined)return false;
  if(beforeData==null||beforeData==undefined)return true;
  if(beforeData[key]==undefined)return true;
  if(beforeData[key]==afterData[key])return false;
  return true;
}

exports.fanoutTeam=functions.database.ref('/PERRINNTeams/{team}').onWrite((data,context)=>{
  const beforeData = data.before.val();
  const afterData = data.after.val();
  var keys=['chatReplayMode','lastMessageTimestamp','lastMessageTimestampNegative','lastMessageName','lastMessageText','lastMessageBalance','name','familyName','imageUrlThumb','leaders','members'];
  var updateKeys=[];
  keys.forEach(key=>{
    if(newValidData(key,beforeData,afterData))updateKeys.push(key);
  });
  return admin.database().ref('/subscribeTeamUsers/'+context.params.team).once('value').then(users=>{
    let updateObj={};
    var batch = admin.firestore().batch();
    updateKeys.forEach(updateKey=>{
      var updateValue;
      if (afterData[updateKey]==undefined) updateValue=null;
      else updateValue=afterData[updateKey];
      users.forEach(user=>{
        batch.update(admin.firestore().doc('PERRINNTeams/'+user.key+'/viewTeams/'+context.params.team),{[updateKey]:updateValue},{create:true});
      });
      if(updateKey=='name') updateObj['PERRINNSearch/teams/'+context.params.team+'/name']=updateValue;
      if(updateKey=='familyName') updateObj['PERRINNSearch/teams/'+context.params.team+'/familyName']=updateValue;
      if(updateKey=='imageUrlThumb') updateObj['PERRINNSearch/teams/'+context.params.team+'/imageUrlThumb']=updateValue;
      if(updateKey=='name'||updateKey=='familyName') {
        var nameLowerCase="";
        if(afterData['name']!=undefined) nameLowerCase=afterData['name'].toLowerCase();
        if(afterData['familyName']!=undefined) nameLowerCase=nameLowerCase+' '+afterData['familyName'].toLowerCase();
        updateObj['PERRINNSearch/teams/'+context.params.team+'/nameLowerCase']=nameLowerCase;
      }
    });
    return admin.database().ref().update(updateObj).then(()=>{
      return batch.commit();
    });
  });
});

exports.newImageTeamSubscription=functions.database.ref('subscribeImageTeams/{image}/{team}').onCreate((data,context)=>{
  return admin.database().ref('PERRINNImages/'+context.params.image).once('value').then(imageData=>{
    if(imageData!=null||imageData!=undefined){
      if(imageData.val().imageUrlThumb!=undefined&&imageData.val().imageUrlMedium!=undefined&&imageData.val().imageUrlOriginal!=undefined){
        return fanoutImage(context.params.image,imageData.val().imageUrlThumb,imageData.val().imageUrlMedium,imageData.val().imageUrlOriginal);
      }
    }
  });
});

exports.newTeam=functions.database.ref('PERRINNTeams/{team}').onCreate((data,context)=>{
  return admin.database().ref('appSettings/specialImages/newTeam').once('value').then(image=>{
    return admin.database().ref('subscribeImageTeams/'+image.val()).update({
      [context.params.team]:true,
    });
  });
});

exports.teamCreation=functions.database.ref('/PERRINNTeams/{team}/createdTimestamp').onCreate((data,context)=>{
  return createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New team:","","",context.params.team,"",'none','none',{});
});

exports.populateLeadersMembersNames=functions.database.ref('/toto').onCreate((data,context)=>{
  var maxUpdatesCount=5000;
  return admin.database().ref('PERRINNTeams/').once('value').then(teams=>{
    let nameArray=[];
    teams.forEach(team=>{
      if(team.child('leaders')!=undefined){
        team.child('leaders').forEach(leader=>{
          nameArray.push(admin.database().ref('PERRINNTeams/'+leader.key+'/name').once('value'));
        });
      }
      if(team.child('members')!=undefined){
        team.child('members').forEach(member=>{
          nameArray.push(admin.database().ref('PERRINNTeams/'+member.key+'/name').once('value'));
        });
      }
    });
    return Promise.all(nameArray);
  }).then(names=>{
    return admin.database().ref('PERRINNTeams/').once('value').then(teams=>{
      let updateObj={};
      var nameIndex=0;
      var updatesCount=0;
      teams.forEach(team=>{
        if(team.child('leaders')!=undefined){
          team.child('leaders').forEach(leader=>{
            var name=names[nameIndex].val();
            updateObj['PERRINNTeams/'+team.key+'/leaders/'+leader.key]={'name':name};
            updatesCount+=1;
            nameIndex+=1;
          });
        }
        if(team.child('members')!=undefined){
          team.child('members').forEach(member=>{
            var name=names[nameIndex].val();
            updateObj['PERRINNTeams/'+team.key+'/members/'+member.key]={'name':name};
            updatesCount+=1;
            nameIndex+=1;
          });
        }
        if(updatesCount>maxUpdatesCount){
          console.log('too many updates');
          return admin.database().ref().update(updateObj);
        }
      });
      return admin.database().ref().update(updateObj);
    });
  });
});

exports.copyPERRINNTeamsToFIRESTORE=functions.database.ref('/toto').onCreate((data,context)=>{
  var maxUpdatesCount=500;
  return admin.database().ref('PERRINNTeams/').once('value').then(teams=>{
    var batch = admin.firestore().batch();
    var updatesCount=0;
    teams.forEach(team=>{
      if(team.val().createdTimestamp!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{createdTimestamp:team.val().createdTimestamp},{create:true});
      updatesCount+=1;
      if(team.val().familyName!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{familyName:team.val().familyName},{create:true});
      updatesCount+=1;
      if(team.val().imageUrlMedium!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{imageUrlMedium:team.val().imageUrlMedium},{create:true});
      updatesCount+=1;
      if(team.val().imageUrlOriginal!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{imageUrlOriginal:team.val().imageUrlOriginal},{create:true});
      updatesCount+=1;
      if(team.val().imageUrlThumb!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{imageUrlThumb:team.val().imageUrlThumb},{create:true});
      updatesCount+=1;
      if(team.val().lastMessageBalance!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{lastMessageBalance:team.val().lastMessageBalance},{create:true});
      updatesCount+=1;
      if(team.val().lastMessageName!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{lastMessageName:team.val().lastMessageName},{create:true});
      updatesCount+=1;
      if(team.val().lastMessageText!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{lastMessageText:team.val().lastMessageText},{create:true});
      updatesCount+=1;
      if(team.val().lastMessageTimestamp!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{lastMessageTimestamp:team.val().lastMessageTimestamp},{create:true});
      updatesCount+=1;
      if(team.val().leaders!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{leaders:team.val().leaders},{create:true});
      updatesCount+=1;
      if(team.val().leadersCount!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{leadersCount:team.val().leadersCount},{create:true});
      updatesCount+=1;
      if(team.val().members!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{members:team.val().members},{create:true});
      updatesCount+=1;
      if(team.val().membersCount!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{membersCount:team.val().membersCount},{create:true});
      updatesCount+=1;
      if(team.val().messageCount!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{messageCount:team.val().messageCount},{create:true});
      updatesCount+=1;
      if(team.val().name!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{name:team.val().name},{create:true});
      updatesCount+=1;
      if(team.val().parent!=undefined)batch.update(admin.firestore().collection('PERRINNTeams').doc(team.key),{parent:team.val().parent},{create:true});
      updatesCount+=1;
      if(updatesCount>maxUpdatesCount-50){
        batch.commit();
        batch = admin.firestore().batch();
        updatesCount=0;
        console.log('next batch');
      }
    });
    console.log('last batch');
    return batch.commit();
  });
});

// creates random 25-character string
function buildNonce() {
  var chars = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0',
    '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ];
  var nonce = '';
  for (var i = 0; i < 25; i++) {
    nonce += chars[Math.floor(Math.random()*chars.length)];
  }
  return nonce;
}

function joinOnshapePERRINNTeam(user) {
  return admin.auth().getUser(user).then(function(userRecord) {
    var email=userRecord.toJSON().email;
    var method='POST';
    var url='https://cad.onshape.com/api/teams/559f8b25e4b056aae06c1b1d/members';
    var body={'email':email,'admin':false};
    const accessKey=functions.config().onshape.accesskey;
    const secretKey=functions.config().onshape.secretkey;
    var urlObj = u.parse(url);
    var urlPath = urlObj.pathname;
    var urlQuery = urlObj.query ? urlObj.query : ''; // if no query, use empty string
    var authDate = (new Date()).toUTCString();
    var nonce = buildNonce();
    var contentType = 'application/json';
    var str = (method + '\n' + nonce + '\n' + authDate + '\n' + contentType + '\n' +
        urlPath + '\n' + urlQuery + '\n').toLowerCase();
    var hmac = crypto.createHmac('sha256', secretKey)
        .update(str)
        .digest('base64');
    var signature = 'On ' + accessKey + ':HmacSHA256:' + hmac;
    //require('request').debug = true;
    return request({
      uri: url,
      method:method,
      headers: {
        'Method':method,
        'Content-type':contentType,
        'Accept':'application/vnd.onshape.v1+json',
        'Authorization':signature,
        'Date':authDate,
        'On-Nonce':nonce
      },
      json: true,
      body: body
    }).then(result=>{
      createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","Joined Onshape:","","",user,"",'none','none',{});
      return 'done';
    }).catch(error=>{
      return error.error.message;
    });
  }).catch(error=>{
    console.log(error);
    return error;
  });
}

function joinPERRINNGoogleGroup(user) {
  return admin.auth().getUser(user).then(function(userRecord) {
    var email=userRecord.toJSON().email;
    var SERVICE_ACCOUNT_EMAIL = 'perrinn-service-account@perrinn.iam.gserviceaccount.com';
    var SERVICE_ACCOUNT_KEY_FILE = './perrinn-73e7f16c6042.json';
    const jwt = new google.auth.JWT(
        SERVICE_ACCOUNT_EMAIL,
        SERVICE_ACCOUNT_KEY_FILE,
        null,
        ['https://www.googleapis.com/auth/admin.directory.group'],
        'nicolas@perrinn.com'
    );
    const admin = google.admin({
      version: 'directory_v1',
      jwt,
    });
    return jwt.authorize().then(() => {
      return admin.members.insert({
        auth: jwt,
        groupKey: "perrinn-google-group@perrinn.com",
        requestBody:{
          email:email,
          role:'MEMBER'
        }
      }).then(result=>{
        createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","Joined Google:","","",user,"",'none','none',{});
        return 'done';
      }).catch(error=>{
        return error.message;
      });
    });
  }).catch(error=>{
    console.log(error);
    return error;
  });
}

exports.onshapeTest=functions.database.ref('/toto').onCreate((data,context)=>{
  return joinOnshapePERRINNTeam('QYm5NATKa6MGD87UpNZCTl6IolX2').then(result=>{
    console.log(result);
  });
});

exports.googleTest=functions.database.ref('/toto').onCreate((data,context)=>{
  return joinPERRINNGoogleGroup('QYm5NATKa6MGD87UpNZCTl6IolX2').then(result=>{
    console.log(result);
  });
});

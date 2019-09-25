const admin = require('firebase-admin')
const processUtils = require('./process')
const teamUtils = require('./team')
const createMessageUtils = require('./createMessage')

module.exports = {

  writeMessageChainData:(team,message)=>{
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
  },

  writeMessagingCostData:(user,team,message)=>{
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
  },

  writeMessageTeamData:(team,message)=>{
    return admin.database().ref('teamMessages/'+team+'/'+message).once('value').then(messageObj=>{
      return admin.firestore().doc('PERRINNTeams/'+team).update({
        lastMessageTimestamp:messageObj.val().payload.timestamp,
        lastMessageName:messageObj.val().payload.name,
        lastMessageText:messageObj.val().payload.text,
        lastMessageBalance:messageObj.val().PERRINN.wallet.balance,
      }).then(()=>{
        return 'done';
      });
    }).catch(error=>{
      console.log(error);
    });
  },

  incrementUserMessageCounter:(user)=>{
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
  },

  writeMessageProcessData:(team,message)=>{
    return admin.database().ref('teamMessages/'+team+'/'+message+'/process').once('value').then(process=>{
      let updateObj={};
      let user='';
      let functionObj={none:'none'};
      let inputs={none:'none'};
      let inputsComplete=false;
      if(process.val()!=undefined&&process.val()!=null){
        if(process.val().inputsComplete){
          user=process.val().user;
          functionObj=process.val().function;
          if(process.val().inputs!=undefined) inputs=process.val().inputs;
          inputsComplete=process.val().inputsComplete;
        }
      }
      return processUtils.executeProcess(user,team,functionObj,inputs).then(result=>{
        if (result==undefined) result='undefined';
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
  },

  writeMessageTransactionOutData:(team,message,process)=>{
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
    return teamUtils.getTeamName(receiver).then(receiverName=>{
      return teamUtils.getTeamImageUrlThumb(receiver).then(receiverImageUrlThumb=>{
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
  },

  writeMessageTransactionInData:(team,message)=>{
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
        return teamUtils.getTeamName(donor).then(donorName=>{
          return teamUtils.getTeamImageUrlThumb(donor).then(donorImageUrlThumb=>{
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
  },

  writeMessageWalletData:(team,message)=>{
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
  },

  writeMessageAtomicData:(team,message)=>{
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
  },

  writeMessageTransactionReceiverData:(team,message)=>{
    return admin.database().ref('teamMessages/'+team+'/'+message+'/PERRINN/transactionOut').once('value').then(transactionOutObj=>{
      if(transactionOutObj.val().processed){
        return createMessageUtils.createMessage(transactionOutObj.val().receiver,"PERRINN","","","",{},{},team,message,{}).then(()=>{
          return 'done';
        });
      }
    }).catch(error=>{
      console.log(error);
    });
  }

}

function checkTransactionInputs (team,inputs) {
  if(inputs.amount>0&&inputs.amount<=100000){
    if(inputs.receiver!=team){
      if(inputs.reference!=''){
        return true;
      }
    }
  }
  return false;
}

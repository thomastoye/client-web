const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const teamUtils = require('../../utils/team')

exports=module.exports=functions.database.ref('teamReads/{reader}/{team}/{message}').onCreate((data,context)=>{
  let updateObj={};
  let amount=0;
  let debtor='';
  return teamUtils.isMemberOrLeader(context.params.reader,context.params.team).then(result=>{
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

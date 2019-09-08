const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const messageUtils = require('../../utils/message')

exports=module.exports=functions.database.ref('/teamMessages/{team}/{message}').onCreate((data,context)=>{
  const message=data.val();
  let writeError=null;
  let lockedTeamChain=false;
  return data.ref.child('/PERRINN').update({
    timestampStart:admin.database.ServerValue.TIMESTAMP,
  }).then(()=>{
    return messageUtils.incrementUserMessageCounter(message.payload.user);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not increment count';
      return null;
    }
    return messageUtils.writeMessagingCostData(message.payload.user,context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write message cost';
      return null;
    }
    return messageUtils.writeMessageProcessData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write process';
      return null;
    }
    return messageUtils.writeMessageTransactionOutData(context.params.team,context.params.message,message.process);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write transaction out';
      return null;
    }
    return messageUtils.writeMessageTransactionInData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write transaction in';
      return null;
    }
    return messageUtils.writeMessageChainData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write chain';
      return null;
    }
    lockedTeamChain=true;
    return messageUtils.writeMessageWalletData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write wallet';
      return null;
    }
    return messageUtils.writeMessageAtomicData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write atomic data';
      return null;
    }
    return messageUtils.writeMessageTeamData(context.params.team,context.params.message);
  }).then(result=>{
    if(result!='done'){
      if(!writeError)writeError='did not write message data';
      return null;
    }
    return messageUtils.writeMessageTransactionReceiverData(context.params.team,context.params.message);
  }).then(()=>{
    if(lockedTeamChain)return admin.database().ref('PERRINNTeamMessageChain/'+context.params.team+'/lock').remove();
    return null;
  }).then(()=>{
    if(writeError) return data.ref.child('/PERRINN').update({dataWrite:writeError});
  });
});

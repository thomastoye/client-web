const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const teamUtils = require('../../utils/team')

exports=module.exports=functions.database.ref('/PERRINNTeams/{team}').onWrite((data,context)=>{
  const beforeData = data.before.val();
  const afterData = data.after.val();
  var keys=['chatReplayMode','lastMessageTimestamp','lastMessageTimestampNegative','lastMessageName','lastMessageText','lastMessageBalance','name','familyName','imageUrlThumb','leaders','members'];
  var updateKeys=[];
  keys.forEach(key=>{
    if(teamUtils.isNewDataValid(key,beforeData,afterData))updateKeys.push(key);
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

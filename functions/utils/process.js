const admin = require('firebase-admin')
const teamUtils = require('./team')
const dbUtils = require('./db')
const onshapeUtils = require('./onshape')
const googleUtils = require('./google')

module.exports = {

  executeProcess:(user,team,functionObj,inputs)=>{
    return admin.database().ref('undefined').once('value').then(()=>{
      if (functionObj.name=='updateKeyValue') {
        var value;
        if(functionObj.value!=undefined)value=functionObj.value;
        else value=inputs.value;
        return dbUtils.updateKeyValue (
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
        return dbUtils.addListKeyValue (
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
        return dbUtils.subscribeList (
          user,
          team,
          functionObj.ref,
          inputs.list
        ).then(result=>{
          return result;
        });
      }
      if (functionObj.name=='removeListKey') {
        return dbUtils.removeListKey (
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
        return teamUtils.createTeam (
          newID,
          user,
          inputs.name,
          "",
          team
        ).then(result=>{
          return result;
        });
      }
      if (functionObj.name=='joinPERRINNOnshapeTeam') {
        return onshapeUtils.joinPERRINNOnshapeTeam (
          user
        ).then(result=>{
          return result;
        });
      }
      if (functionObj.name=='joinPERRINNGoogleGroup') {
        return googleUtils.joinPERRINNGoogleGroup (
          user
        ).then(result=>{
          return result;
        });
      }
      if (functionObj.name=='updateTeamName') {
        return admin.firestore().doc('PERRINNTeams/'+team).update({
          name:inputs.value
        }).then(()=>{
          return 'name updated';
        });
      }
      if (functionObj.name=='updateTeamFamilyName') {
        return admin.firestore().doc('PERRINNTeams/'+team).update({
          familyName:inputs.value
        }).then(()=>{
          return 'family name updated';
        });
      }
      if (functionObj.name=='addTeamMember') {
        let memberProcessed=inputs.key;
        let maxCount=functionObj.maxCount;
        return admin.firestore().doc('PERRINNTeams/'+team).get().then((currentTeam)=>{
          if (currentTeam.data().members!=undefined){
            if (currentTeam.data().members[memberProcessed]!=undefined) {
              return "member already in";
            }
            if (currentTeam.data().membersCount>=maxCount) {
              return "max number of members reached";
            }
          }
          return teamUtils.getTeamName(memberProcessed).then(teamName=>{
            let key='members.'+memberProcessed;
            let value={name:teamName};
            return admin.firestore().doc('PERRINNTeams/'+team).update({
              [key]:value,
              membersCount:currentTeam.data().membersCount+1
            }).then(()=>{
              return "member added";
            });
          });
        });
      }
      if (functionObj.name=='removeTeamMember') {
        let memberProcessed=inputs.key;
        let maxCount=functionObj.maxCount;
        return admin.firestore().doc('PERRINNTeams/'+team).get().then((currentTeam)=>{
          if (currentTeam.data().members!=undefined){
            if (currentTeam.data().members[memberProcessed]==undefined) {
              return "not a member";
            }
          }
          let key='members.'+memberProcessed;
          return admin.firestore().doc('PERRINNTeams/'+team).update({
            [key]:admin.firestore.FieldValue.delete(),
            membersCount:currentTeam.data().membersCount-1
          }).then(()=>{
            return "member removed";
          });
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

}

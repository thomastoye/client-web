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
      if (functionObj.name=='joinOnshapePERRINNTeam') {
        return onshapeUtils.joinOnshapePERRINNTeam (
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
      return 'none';
    }).catch(error=>{
      console.log('executeProcess: '+error);
      return error;
    }).then(result=>{
      return result;
    });
  }

}

const admin = require('firebase-admin')
const teamUtils = require('./team')

module.exports = {

  updateKeyValue:(user,team,ref,key,value)=>{
    return admin.database().ref('PERRINNTeams/'+team).once('value').then((PERRINNTeam)=>{
      if (ref=="PERRINNTeams/"){
        ref=ref+team;
      }
      return admin.database().ref(ref).child(key).once('value').then((currentValue)=>{
        if (ref==null||key==null||value==null){
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
  },

  addListKeyValue:(user,team,ref,list,key,value,maxCount)=>{
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
        return teamUtils.getTeamName(key).then(teamName=>{
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
  },

  subscribeList:(user,team,ref,list)=>{
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
  },

  removeListKey:(user,team,ref,list,key)=>{
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
  },

  executeProcess:(user,team,functionObj,inputs)=>{
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

}

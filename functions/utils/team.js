const admin = require('firebase-admin')

module.exports = {

  createTeam:(team,user,name,familyName,parent)=>{
    const now=Date.now();
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
  },

  isNewDataValid:(key,beforeData,afterData)=>{
    if(afterData[key]==undefined)return false;
    if(beforeData==null||beforeData==undefined)return true;
    if(beforeData[key]==undefined)return true;
    if(beforeData[key]==afterData[key])return false;
    return true;
  },

  isMemberOrLeader:(user,team)=>{
    return admin.database().ref('PERRINNTeams/'+team).once('value').then(teamObj=>{
      if(teamObj.child('leaders').child(user)||teamObj.child('members').child(user))return true;
      else return false;
    });
  },

  getTeamName:(team)=>{
    return admin.database().ref('PERRINNTeams/'+team+'/name').once('value').then(name=>{
      if(name.val()==undefined||name.val()==null)return '';
      else return name.val();
    });
  },

  getTeamImageUrlThumb:(team)=>{
    return admin.database().ref('PERRINNTeams/'+team+'/imageUrlThumb').once('value').then(imageUrlThumb=>{
      if(imageUrlThumb.val()==undefined||imageUrlThumb.val()==null)return '';
      else return imageUrlThumb.val();
    });
  }

}

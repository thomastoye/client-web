const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
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

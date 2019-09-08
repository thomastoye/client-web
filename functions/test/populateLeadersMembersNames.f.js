const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/toto').onCreate((data,context)=>{
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

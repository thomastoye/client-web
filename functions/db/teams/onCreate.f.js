const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const createMessageUtils = require('../../utils/createMessage')

exports=module.exports=functions.firestore.document('PERRINNTeams/{team}').onCreate((data,context)=>{
  let teamObj=data.data();
  teamObj.key=context.params.team;
  return admin.database().ref('appSettings/specialImages/newTeam').once('value').then(image=>{
    return admin.database().ref('subscribeImageTeams/'+image.val()).update({
      [context.params.team]:true,
    }).then(()=>{
      return createMessageUtils.createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New team:","","",{},teamObj,'none','none',{});
    });
  });
});

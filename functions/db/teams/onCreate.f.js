const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const messageUtils = require('../../utils/message')

exports=module.exports=functions.database.ref('PERRINNTeams/{team}').onCreate((data,context)=>{
  return admin.database().ref('appSettings/specialImages/newTeam').once('value').then(image=>{
    return admin.database().ref('subscribeImageTeams/'+image.val()).update({
      [context.params.team]:true,
    }).then(()=>{
      return messageUtils.createMessage ('-L7jqFf8OuGlZrfEK6dT',"PERRINN","New team:","","",context.params.team,"",'none','none',{});
    });
  });
});

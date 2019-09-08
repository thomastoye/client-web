const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const teamUtils = require('../../utils/team')

exports=module.exports=functions.database.ref('/users/{user}/{editID}').onCreate((data,context)=>{
  //test locally: dbUsersOnCreate({name:'testTeam',familyName:'testFamilyName'},{params:{user:'testUser',editId:'testEdit'}})
  const now=Date.now();
  return teamUtils.createTeam(context.params.user,context.params.user,data.val().name,data.val().familyName,"").then(()=>{
    return 'done';
  }).catch(error=>{
    console.log(error);
  });
});

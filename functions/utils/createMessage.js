const admin = require('firebase-admin')
const processUtils = require('./process')
const teamUtils = require('./team')

module.exports = {

  createMessage:(team,user,text,image,action,linkTeam,linkUser,donor,donorMessage,process)=> {
    const now=Date.now();
    return admin.database().ref('PERRINNTeams/'+user).once('value').then(userData=>{
      return admin.database().ref('PERRINNTeams/'+linkUser).once('value').then(linkUserData=>{
        return admin.database().ref('PERRINNTeams/'+linkTeam).once('value').then(linkTeamData=>{
          return admin.database().ref('teamMessages/'+team).push({
            payload:{
              timestamp:now,
              text:text,
              user:user,
              name:userData.val().name,
              imageUrlThumbUser:userData.val().imageUrlThumb,
              image:image,
              action:action,
              linkTeam:linkTeam,
              linkTeamName:linkTeamData.val().name?linkTeamData.val().name:'',
              linkTeamImageUrlThumb:linkTeamData.val().imageUrlThumb?linkTeamData.val().imageUrlThumb:'',
              linkUser:linkUser,
              linkUserName:linkUserData.val().name?linkUserData.val().name:'',
              linkuserFamilyName:linkUserData.val().familyName?linkUserData.val().familyName:'',
              linkUserImageUrlThumb:linkUserData.val().imageUrlThumb?linkUserData.val().imageUrlThumb:'',
            },
            PERRINN:{transactionIn:{donor:donor,donorMessage:donorMessage}},
            process:process,
          });
        });
      });
    });
  },

}

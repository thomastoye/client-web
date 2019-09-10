const admin = require('firebase-admin')
const processUtils = require('./process')
const teamUtils = require('./team')

module.exports = {

  createMessage:(team,user,text,image,action,linkTeam,linkUser,donor,donorMessage,process)=> {
    const now=Date.now();
    return admin.firestore().doc('PERRINNTeams/'+user).get().then(userData=>{
      return admin.firestore().doc('PERRINNTeams/'+linkUser).get().then(linkUserData=>{
        return admin.firestore().doc('PERRINNTeams/'+linkTeam).get().then(linkTeamData=>{
          return admin.database().ref('teamMessages/'+team).push({
            payload:{
              timestamp:now,
              text:text,
              user:user,
              name:userData.data().name,
              imageUrlThumbUser:userData.data().imageUrlThumb,
              image:image,
              action:action,
              linkTeam:linkTeam,
              linkTeamName:linkTeamData.data().name?linkTeamData.data().name:'',
              linkTeamImageUrlThumb:linkTeamData.data().imageUrlThumb?linkTeamData.data().imageUrlThumb:'',
              linkUser:linkUser,
              linkUserName:linkUserData.data().name?linkUserData.data().name:'',
              linkuserFamilyName:linkUserData.data().familyName?linkUserData.data().familyName:'',
              linkUserImageUrlThumb:linkUserData.data().imageUrlThumb?linkUserData.data().imageUrlThumb:'',
            },
            PERRINN:{transactionIn:{donor:donor,donorMessage:donorMessage}},
            process:process,
          });
        });
      });
    });
  },

}

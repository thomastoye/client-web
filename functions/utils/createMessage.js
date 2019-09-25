const admin = require('firebase-admin')
const processUtils = require('./process')
const teamUtils = require('./team')

module.exports = {

  createMessage:(team,user,text,image,action,linkTeamObj,linkUserObj,donor,donorMessage,process)=> {
    const now=Date.now();
    return admin.firestore().doc('PERRINNTeams/'+user).get().then(userData=>{
      return admin.database().ref('teamMessages/'+team).push({
        payload:{
          timestamp:now,
          text:text,
          user:user,
          name:userData.data().name,
          imageUrlThumbUser:userData.data().imageUrlThumb,
          image:image,
          action:action,
          linkTeam: linkTeamObj.key ? linkTeamObj.key : null,
          linkTeamName: linkTeamObj.name ? linkTeamObj.name : null,
          linkTeamImageUrlThumb: linkTeamObj.imageUrlThumb ? linkTeamObj.imageUrlThumb : null,
          linkUser: linkUserObj.key ? linkUserObj.key : null,
          linkUserName: linkUserObj.name ? linkUserObj.name : null,
          linkuserFamilyName: linkUserObj.familyName ? linkUserObj.familyName : null,
          linkUserImageUrlThumb: linkUserObj.imageUrlThumb ? linkUserObj.imageUrlThumb : null,
        },
        PERRINN:{transactionIn:{donor:donor,donorMessage:donorMessage}},
        process:process,
      });
    });
  },

}

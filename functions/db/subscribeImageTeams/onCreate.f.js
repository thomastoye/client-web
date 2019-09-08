const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}
const imageUtils = require('../../utils/image')

exports=module.exports=functions.database.ref('subscribeImageTeams/{image}/{team}').onCreate((data,context)=>{
  return admin.database().ref('PERRINNImages/'+context.params.image).once('value').then(imageData=>{
    if(imageData!=null||imageData!=undefined){
      if(imageData.val().imageUrlThumb!=undefined&&imageData.val().imageUrlMedium!=undefined&&imageData.val().imageUrlOriginal!=undefined){
        return imageUtils.fanoutImage(context.params.image,imageData.val().imageUrlThumb,imageData.val().imageUrlMedium,imageData.val().imageUrlOriginal);
      }
    }
  });
});

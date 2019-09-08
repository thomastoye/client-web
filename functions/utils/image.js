const admin = require('firebase-admin')
const dbUtils = require('./db')

module.exports = {

  /**
   * Convert the output of ImageMagick's `identify -verbose` command to a JavaScript Object.
   */
  imageMagickOutputToObject:(output)=>{
    let previousLineIndent = 0;
    const lines = output.match(/[^\r\n]+/g);
    lines.shift(); // Remove First line
    lines.forEach((line, index)=>{
      const currentIdent = line.search(/\S/);
      line = line.trim();
      if (line.endsWith(':')) {
        lines[index] = dbUtils.makeKeyFirebaseCompatible(`"${line.replace(':', '":{')}`);
      } else {
        const split = line.replace('"', '\\"').split(': ');
        split[0] = dbUtils.makeKeyFirebaseCompatible(split[0]);
        lines[index] = `"${split.join('":"')}",`;
      }
      if (currentIdent < previousLineIndent) {
        lines[index - 1] = lines[index - 1].substring(0, lines[index - 1].length - 1);
        lines[index] = new Array(1 + (previousLineIndent - currentIdent) / 2).join('}') + ',' + lines[index];
      }
      previousLineIndent = currentIdent;
    });
    output = lines.join('');
    output = '{' + output.substring(0, output.length - 1) + '}'; // remove trailing comma.
    output = JSON.parse(output);
    return output;
  },

  fanoutImage:(image,imageUrlThumb,imageUrlMedium,imageUrlOriginal)=>{
    return admin.database().ref('/subscribeImageTeams/'+image).once('value').then(teams=>{
      let updateObj={};
      var batch = admin.firestore().batch();
      updateObj['PERRINNImages/'+image+'/imageUrlThumb']=imageUrlThumb;
      updateObj['PERRINNImages/'+image+'/imageUrlMedium']=imageUrlMedium;
      updateObj['PERRINNImages/'+image+'/imageUrlOriginal']=imageUrlOriginal;
      teams.forEach(team=>{
        updateObj['PERRINNTeams/'+team.key+'/imageUrlThumb']=imageUrlThumb;
        updateObj['PERRINNTeams/'+team.key+'/imageUrlMedium']=imageUrlMedium;
        updateObj['PERRINNTeams/'+team.key+'/imageUrlOriginal']=imageUrlOriginal;
        batch.update(admin.firestore().doc('PERRINNTeams/'+team.key),{imageUrlThumb:imageUrlThumb},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+team.key),{imageUrlMedium:imageUrlMedium},{create:true});
        batch.update(admin.firestore().doc('PERRINNTeams/'+team.key),{imageUrlOriginal:imageUrlOriginal},{create:true});
      });
      return admin.database().ref().update(updateObj).then(()=>{
        return batch.commit().then(()=>{
          return admin.database().ref('/subscribeImageTeams/'+image).remove();
        });
      });
    });
  },

}

const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.storage.object().onFinalize((data,context)=>{
  const object=data;
  const filePath=object.name;
  const fileName=filePath.split('/').pop();
  const imageID=fileName.substring(0,13);
  const fileBucket=object.bucket;
  const bucket=gcs.bucket(fileBucket);
  const tempFilePath=`/tmp/${fileName}`;
  const tempFilePath2=`/tmp/2${fileName}`;
  const ref=admin.database().ref();
  const file=bucket.file(filePath);
  const originalFilePath=filePath.replace(/(\/)?([^\/]*)$/,'$1original_$2');
  const mediumFilePath=filePath.replace(/(\/)?([^\/]*)$/,'$1medium_$2');
  const thumbFilePath=filePath.replace(/(\/)?([^\/]*)$/,'$1thumb_$2');
  if (fileName.startsWith('thumb_')||fileName.startsWith('original_')||fileName.startsWith('medium_')){
    return 0;
  }
  if (!object.contentType.startsWith('image/')){
    return 0;
  }
  if (object.resourceState==='not_exists'){
    return 0;
  }
  return bucket.file(filePath).download({
    destination:tempFilePath,
  }).then(()=>{
    return spawn('identify', ['-verbose', tempFilePath], {capture: ['stdout', 'stderr']});
  }).then(result=>{
    const metadata = imageMagickOutputToObject(result.stdout);
    return admin.database().ref('PERRINNImages/'+imageID).update({
      metadata:metadata,
    });
  }).then(()=>{
    return admin.database().ref('PERRINNImages/'+imageID+'/metadata').once('value');
  }).then(metadata=>{
    if (metadata.val().Orientation=="RightTop") {
      return spawn('convert',[tempFilePath,'-rotate','90',tempFilePath]);
    } else return 0;
  }).catch(error=>{
    console.log("error retrieving metadata: "+error);
    return 0;
  }).then(()=>{
    return spawn('convert',[tempFilePath,'-strip',tempFilePath]);
  }).then(()=>{
    return bucket.upload(tempFilePath,{
      destination:originalFilePath,
    });
  }).then(()=>{
    return spawn('convert',[tempFilePath,'-thumbnail','540x540>',tempFilePath2]);
  }).then(()=>{
    return bucket.upload(tempFilePath2,{
      destination:mediumFilePath,
    });
  }).then(()=>{
    return spawn('convert',[tempFilePath,'-thumbnail','180x180>',tempFilePath]);
  }).then(()=>{
    return bucket.upload(tempFilePath,{
      destination:thumbFilePath,
    });
  }).then(()=>{
    const originalFile=bucket.file(originalFilePath);
    const mediumFile=bucket.file(mediumFilePath);
    const thumbFile=bucket.file(thumbFilePath);
    const config={
      action:'read',
      expires:'01-01-2501'
    };
    return Promise.all([
      originalFile.getSignedUrl(config),
      mediumFile.getSignedUrl(config),
      thumbFile.getSignedUrl(config)
    ]);
  }).then(results=>{
    const originalResult=results[0];
    const mediumResult=results[1];
    const thumbResult=results[2];
    const originalFileUrl=originalResult[0];
    const mediumFileUrl=mediumResult[0];
    const thumbFileUrl=thumbResult[0];
    return fanoutImage(imageID,thumbFileUrl,mediumFileUrl,originalFileUrl);
  }).then(()=>{
    return 1;
  }).catch(error=>{
    console.log("error image processing: "+error);
    return 0;
  });
});

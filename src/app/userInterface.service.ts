import { Injectable }    from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';

@Injectable()
export class userInterfaceService {
  focusUser:string;
  focusProject:string;
  currentTeam:string;
  currentUser: string;
  serviceMessage: string;

  constructor(private afAuth: AngularFireAuth, public db: AngularFireDatabase) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth!=null) {
        this.currentUser=auth.uid;
        if (this.focusUser==null) this.focusUser=auth.uid;
        this.db.object('PERRINNUsers/'+this.focusUser).subscribe(snapshot=>{
          if (this.currentTeam==null) this.currentTeam=snapshot.personalTeam;
        });
      }
      else {
        this.currentUser=null;
        this.focusUser=null;
        this.currentTeam=null;
      }
    });
  }

  refreshServiceMessage(){
    this.db.object('teamServices/'+this.currentTeam+'/process').subscribe(process=>{
      if (process.service === undefined) {
        this.serviceMessage="";
      } else {
        this.db.object('teamMessages/'+this.currentTeam+'/'+process.messageID+'/process').subscribe(process=>{
          if (process.result!==undefined) {
            this.serviceMessage="";
          } else {
            firebase.database().ref('appSettings/PERRINNServices/').once('value').then(services => {
              this.serviceMessage=services.child(process.service).child('process').child(process.step).child('message').val().text;
            });
          }
        });
      }
    });
  }

  processNewMessage(text){
    var newProcess=false;
    var isProcessReady=false;
    return firebase.database().ref('appSettings/PERRINNServices/').once('value').then(services => {
      services.forEach((service)=>{
        var serviceRegex = new RegExp(service.val().regex,"i");
        if (text.match(serviceRegex)) {
          if (service.val().process) {
            firebase.database().ref('teamServices/'+this.currentTeam+'/process').update({
              user:this.currentUser,
              service:service.key,
              step:1,
              messageID:"",
            });
            newProcess=true;
          }
        }
      });
      if (newProcess) {
        return isProcessReady;
      }
      services.forEach((service)=>{
        firebase.database().ref('teamServices/'+this.currentTeam+'/process').once('value').then(process => {
          if (service.key==process.val().service) {
            if (service.child('process').child(process.val().step).val().input) {
              var inputRegex = new RegExp(service.child('process').child(process.val().step).child('input').val().regex,"i");
              var value=text.match(inputRegex);
              if (value) {
                firebase.database().ref('teamServices/'+this.currentTeam+'/process').child('step').transaction((step)=>{
                  return step+1;
                });
                var variable=service.child('process').child(process.val().step).child('input').val().variable;
                if (variable) {
                  var valueString=value[0];
                  if (service.child('process').child(process.val().step).child('input').val().toLowerCase) {
                    valueString=valueString.toLowerCase();
                  }
                  if (service.child('process').child(process.val().step).child('input').val().toUpperCase) {
                    valueString=valueString.toUpperCase();
                  }
                  this.db.object('teamServices/'+this.currentTeam+'/process/inputs').update({
                    [variable]:valueString,
                  });
                }
                if (!service.child('process').child(process.val().step+1).child('input').val()){
                  isProcessReady=true;
                  return isProcessReady;
                } else {
                  return isProcessReady;
                }
              } else {
                this.clearProcessData();
                return isProcessReady;
              }
            }
          }
        }).catch(error=>{
          console.log("cannot read service");
        });
      });
    }).then(()=>{
      return isProcessReady;
    });
  }

  clearProcessData(){
    firebase.database().ref('teamServices/'+this.currentTeam).remove();
  }

}

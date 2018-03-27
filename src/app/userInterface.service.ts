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

  refreshServiceData(){
    firebase.database().ref('appSettings/PERRINNServices/').once('value').then(services => {
      services;
      this.db.object('teamServices/'+this.currentTeam+'/currentProcess').subscribe(currentProcess=>{
        currentProcess;
        if (currentProcess.service === undefined) {
          this.serviceMessage="";
        } else {
          this.serviceMessage=services.child(currentProcess.service).child('process').child(currentProcess.step).child('message').val().text;
          if (currentProcess.step>0&&!services.child(currentProcess.service).child('process').child(currentProcess.step+1).val()){
            firebase.database().ref('teamServices/'+this.currentTeam+'/currentProcess').update({
              readyForServer:true,
            });
          }
        }
      });
    });
  }

  processNewMessage(text){
    var newProcess=false;
    return firebase.database().ref('appSettings/PERRINNServices/').once('value').then(services => {
      services.forEach((service)=>{
        var serviceRegex = new RegExp(service.val().regex,"i");
        if (text.match(serviceRegex)) {
          if (service.val().process) {
            firebase.database().ref('teamServices/'+this.currentTeam+'/currentProcess').update({
              user:this.currentUser,
              service:service.key,
              step:1,
            });
            newProcess=true;
          }
        }
      });
      if (newProcess) {
        return;
      }
      services.forEach((service)=>{
        firebase.database().ref('teamServices/'+this.currentTeam+'/currentProcess').once('value').then(currentProcess => {
          if (service.key==currentProcess.val().service) {
            if (service.child('process').child(currentProcess.val().step).val().input) {
              var inputRegex = new RegExp(service.child('process').child(currentProcess.val().step).child('input').val().regex,"i");
              var value=text.match(inputRegex);
              if (value) {
                firebase.database().ref('teamServices/'+this.currentTeam+'/currentProcess').child('step').transaction((step)=>{
                  return step+1;
                });
                var variable=service.child('process').child(currentProcess.val().step).child('input').val().variable;
                if (variable) {
                  var valueString=value[0];
                  if (service.child('process').child(currentProcess.val().step).child('input').val().toLowerCase) {
                    valueString=valueString.toLowerCase();
                  }
                  if (service.child('process').child(currentProcess.val().step).child('input').val().toUpperCase) {
                    valueString=valueString.toUpperCase();
                  }
                  this.db.object('teamServices/'+this.currentTeam+'/inputs').update({
                    [variable]:valueString,
                  });
                }
              } else {
                this.clearCurrentProcess();
              }
            }
          }
        });
      });
    });
  }

  clearCurrentProcess(){
    firebase.database().ref('teamServices/'+this.currentTeam).remove();
  }

}

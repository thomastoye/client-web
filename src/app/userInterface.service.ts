import { Injectable }    from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';

@Injectable()
export class userInterfaceService {
  focusUser:string;
  focusUserObj:any;
  focusProject:string;
  currentTeam:string;
  currentTeamObj:any;
  currentUser:string;
  currentUserObj:any;
  currentUserFirstName:string;
  currentUserLastName:string;
  currentUserImageUrlThumb:string;
  services:any;
  serviceMessage:string;
  serviceProcess:any;

  constructor(private afAuth: AngularFireAuth, public db: AngularFireDatabase) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth!=null) {
        this.currentUser=auth.uid;
        this.db.object('PERRINNUsers/'+this.currentUser).subscribe(snapshot=>{
          this.currentUserObj=snapshot;
        });
        if (this.focusUser==null) this.focusUser=auth.uid;
        this.db.object('PERRINNUsers/'+this.focusUser).subscribe(snapshot=>{
          if (this.currentTeam==null) this.currentTeam=snapshot.personalTeam;
        });
        firebase.database().ref('appSettings/PERRINNServices/').once('value').then(services=>{
          this.services=services;
          this.serviceProcess={};
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
    if (this.serviceProcess === undefined) {
      this.serviceMessage="";
    } else {
      if (this.serviceProcess[this.currentTeam] === undefined) {
        this.serviceMessage="";
      } else {
        if (this.serviceProcess[this.currentTeam].service === undefined) {
          this.serviceMessage="";
        } else {
          this.db.object('teamMessages/'+this.currentTeam+'/'+this.serviceProcess[this.currentTeam].messageID+'/process').subscribe(processMessage=>{
            if (processMessage.result!==undefined) {
              this.serviceMessage="";
            } else {
              this.serviceMessage=this.services.child(this.serviceProcess[this.currentTeam].service).child('process').child(this.serviceProcess[this.currentTeam].step).child('message').val().text;
            }
          });
        }
      }
    }
  }

  processNewMessage(text){
    var newProcess=false;
    var isProcessReady=false;
    this.services.forEach((service)=>{
      var serviceRegex = new RegExp(service.val().regex,"i");
      if (text.match(serviceRegex)) {
        if (service.val().process) {
        this.serviceProcess[this.currentTeam]={
          user:this.currentUser,
          service:service.key,
          step:1,
          messageID:"",
          inputs:{},
        };
        newProcess=true;
        }
      }
    });
    if (newProcess) {
      return isProcessReady;
    }
    this.services.forEach((service)=>{
      if (service.key==this.serviceProcess[this.currentTeam].service) {
        if (service.child('process').child(this.serviceProcess[this.currentTeam].step).val().input) {
          var inputRegex = new RegExp(service.child('process').child(this.serviceProcess[this.currentTeam].step).child('input').val().regex,"i");
          var value=text.match(inputRegex);
          if (value) {
            var variable=service.child('process').child(this.serviceProcess[this.currentTeam].step).child('input').val().variable;
            if (variable) {
              var valueString=value[0];
              if (service.child('process').child(this.serviceProcess[this.currentTeam].step).child('input').val().toLowerCase) {
                valueString=valueString.toLowerCase();
              }
              if (service.child('process').child(this.serviceProcess[this.currentTeam].step).child('input').val().toUpperCase) {
                valueString=valueString.toUpperCase();
              }
              this.serviceProcess[this.currentTeam].inputs[variable]=valueString ;
            }
            if (!service.child('process').child(this.serviceProcess[this.currentTeam].step+1).child('input').val()){
              isProcessReady=true;
            }
            this.serviceProcess[this.currentTeam].step+=1;
            this.refreshServiceMessage();
          } else {
            this.clearProcessData();
            this.refreshServiceMessage();
          }
        }
      }
    });
    return isProcessReady;
  }

  clearProcessData(){
    this.serviceProcess[this.currentTeam]={};
  }

}

import { Injectable }    from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { userInterfaceService } from './userInterface.service';

@Injectable()
export class databaseService {

  constructor(public db: AngularFireDatabase, public UI: userInterfaceService) {
  }

  getUserFirstName(ID:string):string{
    var output;
    this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{output=snapshot.firstName});
    return output;
  }
  getUserImageUrlThumb(ID:string):string{
    var output;
    this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{
      if(snapshot.imageUrlThumb!=undefined){
        output=snapshot.imageUrlThumb;
      } else {
        output=snapshot.image;
        if (output!==undefined) {
          if (output.indexOf('.')===-1) {
            this.db.object('PERRINNImages/'+output).subscribe(snapshot=>{
              output=snapshot.imageUrlThumb;
            });
          }
        }
      }
    });
    return output;
  }
  getTeamName(ID:string):string{
    var output;
    this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{output=snapshot.name});
    return output;
  }
  getTeamImageUrlOriginal(ID:string):string{
    var output;
    this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{
      output=snapshot.image;
      if (output!==undefined) {
        if (output.indexOf('.')===-1) {
          this.db.object('PERRINNImages/'+output).subscribe(snapshot=>{
            output=snapshot.imageUrlOriginal;
          });
        }
      }
    });
    return output;
  }
  getTeamImageUrlMedium(ID:string):string{
    var output;
    this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{
      output=snapshot.image;
      if (output!==undefined) {
        if (output.indexOf('.')===-1) {
          this.db.object('PERRINNImages/'+output).subscribe(snapshot=>{
            output=snapshot.medium;
          });
        }
      }
    });
    return output;
  }
  getTeamImageUrlThumb(ID:string):string{
    var output;
    this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{
      output=snapshot.image;
      if (output!==undefined) {
        if (output.indexOf('.')===-1) {
          this.db.object('PERRINNImages/'+output).subscribe(snapshot=>{
            output=snapshot.imageUrlThumb;
          });
        }
      }
    });
    return output;
  }
  getTeamLeader(teamID:string,userID:string):boolean{
    var output;
    this.db.object('PERRINNTeams/'+teamID+'/leaders/'+userID).subscribe(snapshot=>{output=snapshot.$value});
    return output;
  }
  getTeamBalance(ID:string):string{
    var output;
    this.db.object('PERRINNTeamBalance/'+ID).subscribe(snapshot=>{output=snapshot.balance?snapshot.balance:0});
    return output;
  }
  getProjectTeamLeader(projectID,teamID):string{
    var output;
    this.db.object('projectTeams/'+projectID+'/'+teamID).subscribe(snapshot=>{output=snapshot.leader});
    return output;
  }
  getProjectTeamMember(projectID,teamID):string{
    var output;
    this.db.object('projectTeams/'+projectID+'/'+teamID).subscribe(snapshot=>{output=snapshot.member});
    return output;
  }
  getProjectName(ID:string):string{
    var output;
    this.db.object('projects/'+ID).subscribe(snapshot=>{output=snapshot.name});
    return output;
  }
  getProjectImageUrlOriginal(ID:string):string{
    var output;
    this.db.object('projects/'+ID).subscribe(snapshot=>{
      output=snapshot.image;
      if (output!==undefined) {
        if (output.indexOf('.')===-1) {
          this.db.object('PERRINNImages/'+output).subscribe(snapshot=>{
            output=snapshot.imageUrlOriginal;
          });
        }
      }
    });
    return output;
  }
  getProjectImageUrlMedium(ID:string):string{
    var output;
    this.db.object('projects/'+ID).subscribe(snapshot=>{
      output=snapshot.image;
      if (output!==undefined) {
        if (output.indexOf('.')===-1) {
          this.db.object('PERRINNImages/'+output).subscribe(snapshot=>{
            output=snapshot.medium;
          });
        }
      }
    });
    return output;
  }
  getProjectImageUrlThumb(ID:string):string{
    var output;
    this.db.object('projects/'+ID).subscribe(snapshot=>{
      output=snapshot.image;
      if (output!==undefined) {
        if (output.indexOf('.')===-1) {
          this.db.object('PERRINNImages/'+output).subscribe(snapshot=>{
            output=snapshot.imageUrlThumb;
          });
        }
      }
    });
    return output;
  }
  getProjectGoal(ID:string):string{
    var output;
    this.db.object('projects/'+ID).subscribe(snapshot=>{output=snapshot.goal});
    return output;
  }
  getProjectDocument(ID:string):string{
    var output;
    this.db.object('projects/'+ID).subscribe(snapshot=>{output=snapshot.document});
    return output;
  }
}

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
  getUserLastName(ID:string):string{
    var output;
    this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{output=snapshot.lastName});
    return output;
  }
  getUserPhotoURL(ID:string):string{
    var output;
    this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{output=snapshot.photoURL});
    return output;
  }
  getUserCreatedTimestamp(ID:string):string{
    var output;
    this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{output=snapshot.createdTimestamp});
    return output;
  }
  getUserMessageCount(ID:string):string{
    var output;
    this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{output=snapshot.messageCount});
    return output;
  }
  getUserPersonalTeam(ID:string):string{
    var output;
    this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{output=snapshot.personalTeam});
    return output;
  }
  getUserFollowing(userID,teamID):string{
    var output;
    this.db.object('userTeams/'+userID+'/'+teamID).subscribe(snapshot=>{output=snapshot.following});
    return output;
  }
  getTeamName(ID:string):string{
    var output;
    this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{output=snapshot.name});
    return output;
  }
  getTeamPhotoURL(ID:string):string{
    var output;
    this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{output=snapshot.photoURL});
    return output;
  }
  getTeamLeader(teamID:string,userID:string):boolean{
    var output;
    this.db.object('PERRINNTeams/'+teamID+'/leaders/'+userID).subscribe(snapshot=>{output=snapshot.$value});
    return output;
  }
  getTeamMember(teamID:string,userID:string):boolean{
    var output;
    this.db.object('PERRINNTeams/'+teamID+'/members/'+userID).subscribe(snapshot=>{output=snapshot.$value});
    return output;
  }
  getTeamMembersCount(ID:string):string{
    var output;
    this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{output=snapshot.membersCount});
    return output;
  }
  getTeamBalance(ID:string):string{
    var output;
    this.db.object('PERRINNTeamBalance/'+ID).subscribe(snapshot=>{output=snapshot.balance?snapshot.balance:0});
    return output;
  }
  getTeamLastMessageTimestamp(ID:string):string{
    var output;
    this.db.object('teamActivities/'+ID).subscribe(snapshot=>{output=snapshot.lastMessageTimestamp});
    return output;
  }
  getTeamLastMessageText(ID:string):string{
    var output;
    this.db.object('teamActivities/'+ID).subscribe(snapshot=>{output=snapshot.lastMessageText});
    return output;
  }
  getTeamLastMessageUser(ID:string):string{
    var output;
    this.db.object('teamActivities/'+ID).subscribe(snapshot=>{output=snapshot.lastMessageUser});
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
  getProjectTeamFollowing(teamID,projectID):string{
    var output;
    this.db.object('teamProjects/'+teamID+'/'+projectID).subscribe(snapshot=>{output=snapshot.following});
    return output;
  }
  getProjectName(ID:string):string{
    var output;
    this.db.object('projects/'+ID).subscribe(snapshot=>{output=snapshot.name});
    return output;
  }
  getProjectPhotoURL(ID:string):string{
    var output;
    this.db.object('projects/'+ID).subscribe(snapshot=>{output=snapshot.photoURL});
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
  getPERRINNGlobalMessage():string{
    var output;
    this.db.object('appSettings/').subscribe(snapshot=>{output=snapshot.PERRINNGlobalMessage});
    return output;
  }
  getServiceRegex(ID:string):string{
    var output;
    this.db.object('appSettings/PERRINNServices/'+ID).subscribe(snapshot=>{output=snapshot.regex});
    return output;
  }
}

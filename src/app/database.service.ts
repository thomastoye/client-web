import { Injectable }    from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { userInterfaceService } from './userInterface.service';

@Injectable()
export class databaseService {
  userFirstName: string[];
  userLastName: string[];
  userPhotoURL: string[];
  userCreatedTimestamp: string[];
  userMessageCount: string[];
  userPersonalTeam: string[];
  teamName: string[];
  teamPhotoURL: string[];
  teamMembersCount: string[];
  teamBalance: string[];
  teamLastMessageTimestamp: string[];
  teamLastMessageText: string[];
  teamLastMessageUser: string[];
  projectName: string[];
  projectPhotoURL: string[];
  projectGoal: string[];
  projectDocument: string[];

  constructor(public db: AngularFireDatabase, public UI: userInterfaceService) {
    this.userFirstName=[''];
    this.userLastName=[''];
    this.userPhotoURL=[''];
    this.userCreatedTimestamp=[''];
    this.userMessageCount=[''];
    this.userPersonalTeam=[''];
    this.teamName=[''];
    this.teamPhotoURL=[''];
    this.teamMembersCount=[''];
    this.teamBalance=[''];
    this.teamLastMessageTimestamp=[''];
    this.teamLastMessageText=[''];
    this.teamLastMessageUser=[''];
    this.projectName=[''];
    this.projectPhotoURL=[''];
    this.projectGoal=[''];
    this.projectDocument=[''];
  }

  getUserFirstName(ID:string):string{
    if(this.userFirstName[ID]==null) this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{this.userFirstName[ID]=snapshot.firstName});
    return this.userFirstName[ID];
  }
  getUserLastName(ID:string):string{
    if(this.userLastName[ID]==null) this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{this.userLastName[ID]=snapshot.lastName});
    return this.userLastName[ID];
  }
  getUserPhotoURL(ID:string):string{
    if(this.userPhotoURL[ID]==null) this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{this.userPhotoURL[ID]=snapshot.photoURL});
    return this.userPhotoURL[ID];
  }
  getUserCreatedTimestamp(ID:string):string{
    if(this.userCreatedTimestamp[ID]==null) this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{this.userCreatedTimestamp[ID]=snapshot.createdTimestamp});
    return this.userCreatedTimestamp[ID];
  }
  getUserMessageCount(ID:string):string{
    if(this.userMessageCount[ID]==null) this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{this.userMessageCount[ID]=snapshot.messageCount});
    return this.userMessageCount[ID];
  }
  getUserPersonalTeam(ID:string):string{
    if(this.userPersonalTeam[ID]==null) this.db.object('PERRINNUsers/'+ID).subscribe(snapshot=>{this.userPersonalTeam[ID]=snapshot.personalTeam});
    return this.userPersonalTeam[ID];
  }
  getUserFollowing(userID,teamID):string{
    var output;
    this.db.object('userTeams/'+userID+'/'+teamID).subscribe(snapshot=>{output=snapshot.following});
    return output;
  }
  getTeamName(ID:string):string{
    if(this.teamName[ID]==null) this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{this.teamName[ID]=snapshot.name});
    return this.teamName[ID];
  }
  getTeamPhotoURL(ID:string):string{
    if(this.teamPhotoURL[ID]==null) this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{this.teamPhotoURL[ID]=snapshot.photoURL});
    return this.teamPhotoURL[ID];
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
    if(this.teamMembersCount[ID]==null) this.db.object('PERRINNTeams/'+ID).subscribe(snapshot=>{this.teamMembersCount[ID]=snapshot.membersCount});
    return this.teamMembersCount[ID];
  }
  getTeamBalance(ID:string):string{
    if(this.teamBalance[ID]==null) this.db.object('PERRINNTeamBalance/'+ID).subscribe(snapshot=>{this.teamBalance[ID]=snapshot.balance});
    return this.teamBalance[ID]||0;
  }
  getTeamLastMessageTimestamp(ID:string):string{
    if(this.teamLastMessageTimestamp[ID]==null) this.db.object('teamActivities/'+ID).subscribe(snapshot=>{this.teamLastMessageTimestamp[ID]=snapshot.lastMessageTimestamp});
    return this.teamLastMessageTimestamp[ID];
  }
  getTeamLastMessageText(ID:string):string{
    if(this.teamLastMessageText[ID]==null) this.db.object('teamActivities/'+ID).subscribe(snapshot=>{this.teamLastMessageText[ID]=snapshot.lastMessageText});
    return this.teamLastMessageText[ID];
  }
  getTeamLastMessageUser(ID:string):string{
    if(this.teamLastMessageUser[ID]==null) this.db.object('teamActivities/'+ID).subscribe(snapshot=>{this.teamLastMessageUser[ID]=snapshot.lastMessageUser});
    return this.teamLastMessageUser[ID];
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
    if(this.projectName[ID]==null) this.db.object('projects/'+ID).subscribe(snapshot=>{this.projectName[ID]=snapshot.name});
    return this.projectName[ID];
  }
  getProjectPhotoURL(ID:string):string{
    if(this.projectPhotoURL[ID]==null) this.db.object('projects/'+ID).subscribe(snapshot=>{this.projectPhotoURL[ID]=snapshot.photoURL});
    return this.projectPhotoURL[ID];
  }
  getProjectGoal(ID:string):string{
    if(this.projectGoal[ID]==null) this.db.object('projects/'+ID).subscribe(snapshot=>{this.projectGoal[ID]=snapshot.goal});
    return this.projectGoal[ID];
  }
  getProjectDocument(ID:string):string{
    if(this.projectDocument[ID]==null) this.db.object('projects/'+ID).subscribe(snapshot=>{this.projectDocument[ID]=snapshot.document});
    return this.projectDocument[ID];
  }
  getPERRINNGlobalMessage():string{
    var output;
    this.db.object('appSettings/').subscribe(snapshot=>{output=snapshot.PERRINNGlobalMessage});
    return output;
  }
}

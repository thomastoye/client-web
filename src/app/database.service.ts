import { Injectable }    from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Router } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Injectable()
export class databaseService {
  userFirstName: string[];
  userLastName: string[];
  userPhotoURL: string[];
  userLeader: string[][];
  userMember: string[][];
  userFollowing: string[][];
  teamName: string[];
  teamPhotoURL: string[];
  teamBalance: string[];
  projectName: string[];
  projectPhotoURL: string[];
  projectGoal: string[];
  projectDocument: string[];

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService) {
    this.userFirstName=[''];
    this.userLastName=[''];
    this.userPhotoURL=[''];
    this.userLeader=[[''],['']];
    this.userMember=[[''],['']];
    this.userFollowing=[[''],['']];
    this.teamName=[''];
    this.teamPhotoURL=[''];
    this.teamBalance=[''];
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
  getTeamName(ID:string):string{
    if(this.teamName[ID]==null) this.db.object('teams/'+ID).subscribe(snapshot=>{this.teamName[ID]=snapshot.name});
    return this.teamName[ID];
  }
  getTeamPhotoURL(ID:string):string{
    if(this.teamPhotoURL[ID]==null) this.db.object('teams/'+ID).subscribe(snapshot=>{this.teamPhotoURL[ID]=snapshot.photoURL});
    return this.teamPhotoURL[ID];
  }
  getTeamBalance(ID:string):string{
    if(this.teamBalance[ID]==null) this.db.object('PERRINNTeamBalance/'+ID).subscribe(snapshot=>{this.teamBalance[ID]=snapshot.balance});
    return this.teamBalance[ID];
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
  getUserLeader(teamID,userID):string{
    var output;
    this.db.object('teamUsers/'+teamID+'/'+userID).subscribe(snapshot=>{output=snapshot.leader});
    return output;
  }
  getUserMember(teamID,userID):string{
    var output;
    this.db.object('teamUsers/'+teamID+'/'+userID).subscribe(snapshot=>{output=snapshot.member});
    return output;
  }
  getUserFollowing(userID,teamID):string{
    var output;
    this.db.object('userTeams/'+userID+'/'+teamID).subscribe(snapshot=>{output=snapshot.following});
    return output;
  }
  getTeamLeader(projectID,teamID):string{
    var output;
    this.db.object('projectTeams/'+projectID+'/'+teamID).subscribe(snapshot=>{output=snapshot.leader});
    return output;
  }
  getTeamMember(projectID,teamID):string{
    var output;
    this.db.object('projectTeams/'+projectID+'/'+teamID).subscribe(snapshot=>{output=snapshot.member});
    return output;
  }
  getTeamFollowing(teamID,projectID):string{
    var output;
    this.db.object('teamProjects/'+teamID+'/'+projectID).subscribe(snapshot=>{output=snapshot.following});
    return output;
  }
}

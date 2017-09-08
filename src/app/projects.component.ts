import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router, NavigationEnd } from '@angular/router'

@Component({
  selector: 'projects',
  template: `
  <div class='sheet'>
    <ul>
      <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="db.object('userInterface/'+currentUserID).update({focusProject: project.$key});router.navigate(['projectProfile'])">
        <img (error)="errorHandler($event)"[src]="getPhotoURL(project.$key)" style="object-fit: cover; height:125px; width:125px">
        <div style="height:25px;font-size:10px;line-height:10px">{{getProjectName(project.$key)}}{{(getTeamLeader(project.$key,currentTeamID)? " **" : "")}}</div>
      </li>
    </ul>
    <button [hidden]='!getUserLeader(currentTeamID)' (click)="this.router.navigate(['followProject'])" style="background-color:#c69b00">Follow a project</button>
    <button [hidden]='!getUserLeader(currentTeamID)' (click)="this.router.navigate(['createProject'])" style="background-color:#c69b00">Create a project</button>
  </div>
`,
})
export class ProjectsComponent  {

  currentUserID: string;
  currentTeamID: string;
  teamProjects: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){
        this.teamProjects = null;
      }
      else {
        this.currentUserID = auth.uid;
        this.db.object('userInterface/'+auth.uid+'/currentTeam').subscribe(currentTeam => {
          this.currentTeamID = currentTeam.$value;
          this.teamProjects = this.db.list('teamProjects/' + currentTeam.$value, {
            query:{
              orderByChild:'following',
              equalTo: true,
            }
          });
        });
      }
    });
  }

  getProjectName (ID: string) :string {
    var output;
    this.db.object('projects/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  getUserFollowing (userID: string, teamID: string) :boolean {
    var output;
    this.db.object('userTeams/' + userID + '/' + teamID).subscribe(snapshot => {
      output = snapshot.following
    });
    return output;
  }

  getPhotoURL (ID: string) :string {
    var output;
    this.db.object('projects/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  getUserLeader (ID: string) :string {
    var output;
    this.db.object('teamUsers/' + ID + '/' + this.currentUserID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  getTeamLeader (projectID: string, teamID: string) :string {
    var output;
    this.db.object('projectTeams/' + projectID + '/' + teamID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'projecProfile',
  template: `
  <div class="sheet">
  <div style="float: left; width: 50%;">
  <div [hidden]='editMode'>
  <div class='title'>{{name}}</div>
  <div style="padding:10px;">{{goal}} {{goal?"":"Add a goal here..."}}</div>
  <button [hidden]='!ownProject' (click)="editMode=true">Edit project</button>
  </div>
  <div [hidden]='!editMode'>
  <input maxlength="20" [(ngModel)]="name" style="text-transform: lowercase; font-weight:bold;" placeholder="first name *" />
  <input maxlength="140" [(ngModel)]="goal" placeholder="Project goal (140 characters max) *" />
  <input maxlength="500" [(ngModel)]="photoURL" placeholder="Image address from the web *" />
  <button (click)="updateProjectProfile()">Save profile</button>
  </div>
  </div>
  <div style="float: right; width: 50%;">
  <img (error)="errorHandler($event)" [src]="photoURL" style="object-fit:contain; height:200px; width:100%">
  </div>
  <div style="height:30px;width:100%"></div>
  <ul class="listLight">
    <div class="listSeperator">{{name}} teams:</div>
    <li *ngFor="let team of projectTeams | async"
      [class.selected]="team.$key === selectedTeamID"
      (click)="selectedTeamID = team.$key">
      <img (error)="errorHandler($event)" [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
      <div style="width:15px;height:25px;float:left;">{{getUserLeader(team.$key,currentUserID)?"*":""}}</div>
      <div style="width:200px;height:25px;float:left;">{{getTeamName(team.$key)}}</div>
      <div [hidden]='team.$key!=selectedTeamID' style="float:right">
      <div class="button" (click)="followTeam(selectedTeamID,currentUserID)">Follow</div>
      </div>
    </li>
  </ul>
  </div>
  `,
})
export class ProjectProfileComponent {
  currentUserID: string;
  focusProjectID: string;
  name: string;
  goal: string;
  photoURL: string;
  editMode: boolean;
  currentTeamID: string;
  memberStatus: string;
  leaderStatus: boolean;
  messageCancelMembership: string;
  ownProject: boolean;
  projectTeams: FirebaseListObservable<any>;
  selectedTeamID: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        db.object('userInterface/'+auth.uid).subscribe(userInterface=>{
          this.currentTeamID = userInterface.currentTeam;
          this.focusProjectID = userInterface.focusProject;
          this.messageCancelMembership = ""
          db.object('projects/' + this.focusProjectID).subscribe(focusProject => {
            this.name = focusProject.name;
            this.goal = focusProject.goal;
            this.photoURL = focusProject.photoURL;
            this.editMode = false;
          });
          this.projectTeams = db.list('projectTeams/' + this.focusProjectID, {
            query:{
              orderByChild:'member',
              equalTo: true,
            }
          });
        });
      }
    });
  }

  updateProjectProfile() {
    this.name = this.name.toUpperCase();
    this.db.object('projects/'+this.focusProjectID).update({
      name: this.name, photoURL: this.photoURL, goal: this.goal
    });
    this.editMode=false;
  }

  cancelMember(projectID: string, teamID: string) {
    this.db.object('projectTeams/' + projectID + '/' + teamID).update({member:false})
    .then(_ => this.router.navigate(['teamSettings']))
    .catch(err => this.messageCancelMembership="Error: Only a leader can cancel a membership - A leader's membership cannot be cancelled");
  }

  getUserLeader (teamID: string, userID: string) :string {
    var output;
    this.db.object('teamUsers/' + teamID + '/' + userID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  getTeamName (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  getTeamPhotoURL (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  followTeam (teamID: string, userID: string) {
    if (teamID==null || teamID=="") {return null}
    else {
      this.db.object('userTeams/'+userID+'/'+teamID).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
      this.db.object('userInterface/'+userID).update({currentTeam: teamID});
      this.router.navigate(['teamSettings']);
    }
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

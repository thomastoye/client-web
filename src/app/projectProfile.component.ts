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
  <div style="padding:10px;" [innerHTML]="goal | linky"></div>
  <button [hidden]='!teamAndProjectLeader' (click)="editMode=true">Edit project</button>
  </div>
  <div [hidden]='!editMode'>
  <input maxlength="20" [(ngModel)]="name" style="text-transform: lowercase; font-weight:bold;" placeholder="first name *" />
  <input maxlength="500" [(ngModel)]="goal" placeholder="Project goal (500 characters max) *" />
  <input maxlength="500" [(ngModel)]="photoURL" placeholder="Image address from the web *" />
  <button (click)="updateProjectProfile()">Save profile</button>
  <button [hidden]='!teamAndProjectLeader' *ngIf="editMode" (click)="this.router.navigate(['addTeam'])" style="background-color:#c69b00">Add a team</button>
  </div>
  </div>
  <div style="float: right; width: 50%;position:relative">
  <img (error)="errorHandler($event)" [src]="photoURL" style="background-color:#0e0e0e;object-fit:contain; height:200px; width:100%">
  <div style="position:absolute;left:10px;top:10px;">
  <input type="file" name="projectImage" id="projectImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
  <label for="projectImage" id="buttonFile">
  <img src="./../assets/App icons/camera.png" style="width:25px">
  </label>
  </div>
  </div>
  <div style="height:30px;width:100%"></div>
  <div class="title">{{name}} teams:</div>
  <ul class="listLight">
    <li *ngFor="let team of projectTeams | async"
      [class.selected]="team.$key === selectedTeamID"
      (click)="selectedTeamID = team.$key;db.object('userInterface/'+currentUserID).update({currentTeam: team.$key});router.navigate(['teamProfile'])">
      <img (error)="errorHandler($event)" [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div style="width:15px;height:25px;float:left;">{{getUserLeader(team.$key,currentUserID)?"*":""}}</div>
      <div style="width:300px;height:25px;float:left;">{{getTeamName(team.$key)}}{{(getTeamLeader(currentProjectID,team.$key)? " **" : "")}}{{getTeamFollowing(team.$key,currentProjectID)?"":" (Not Following)"}}</div>
      <button [hidden]='!teamAndProjectLeader' *ngIf="editMode" style="float:right" (click)="db.object('projectTeams/'+currentProjectID+'/'+team.$key).update({member:false,leader:false});" style="background-color:red">Remove</button>
    </li>
  </ul>
  </div>
  `,
})
export class ProjectProfileComponent {
  currentUserID: string;
  currentProjectID: string;
  name: string;
  goal: string;
  photoURL: string;
  editMode: boolean;
  currentTeamID: string;
  memberStatus: string;
  leaderStatus: boolean;
  messageCancelMembership: string;
  teamAndProjectLeader: boolean;
  projectTeams: FirebaseListObservable<any>;
  selectedTeamID: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        db.object('userInterface/'+auth.uid).subscribe(userInterface=>{
          this.currentTeamID = userInterface.currentTeam;
          this.currentProjectID = userInterface.focusProject;
          this.messageCancelMembership = ""
          db.object('projects/' + this.currentProjectID).subscribe(focusProject => {
            this.name = focusProject.name;
            this.goal = focusProject.goal;
            this.photoURL = focusProject.photoURL;
            this.editMode = false;
            db.object('projectTeams/'+this.currentProjectID+'/'+this.currentTeamID).subscribe(projectTeam => {
              db.object('teamUsers/'+this.currentTeamID+'/'+this.currentUserID).subscribe(teamUser => {
                this.teamAndProjectLeader=(teamUser.leader && projectTeam.leader);
              });
            });
          });
          this.projectTeams = db.list('projectTeams/' + this.currentProjectID, {
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
    this.db.object('projects/'+this.currentProjectID).update({
      name: this.name, photoURL: this.photoURL, goal: this.goal
    });
    this.editMode=false;
  }

  cancelMember(projectID: string, teamID: string) {
    this.db.object('projectTeams/' + projectID + '/' + teamID).update({member:false})
    .then(_ => this.router.navigate(['teamProfile']))
    .catch(err => this.messageCancelMembership="Error: Only a leader can cancel a membership - A leader's membership cannot be cancelled");
  }

  getUserLeader (teamID: string, userID: string) :string {
    var output;
    this.db.object('teamUsers/' + teamID + '/' + userID).subscribe(snapshot => {
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

  getTeamFollowing (teamID: string, projectID: string) :boolean {
    var output;
    this.db.object('teamProjects/' + teamID + '/' + projectID).subscribe(snapshot => {
      output = snapshot.following
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

  onImageChange(event) {
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

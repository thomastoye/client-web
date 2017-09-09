import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router, NavigationEnd } from '@angular/router'

@Component({
  selector: 'users',
  template: `
  <div class='sheet'>
  <div>
  <img (error)="errorHandler($event)"[src]="this.photoURL" style="object-fit:contain;background-color:#0e0e0e;max-height:350px; width:100%">
  <div class="sheet" style="width:290px;display:block;margin: 10px auto;padding:5px;position:relative;top:-50px;">
  <div style="text-align:center;font-size:18px;font-family:sans-serif;">{{teamName}}</div>
  <ul class='listLight' style="float:left">
    <li class='userIcon' *ngFor="let user of teamLeaders | async" (click)="db.object('userInterface/'+currentUserID).update({focusUser: user.$key});router.navigate(['userProfile'])">
      <img (error)="errorHandler($event)"[src]="getPhotoURL(user.$key)" style="margin:5px;border-radius:6px; object-fit: cover; height:130px; width:130px">
      <div style="font-size:10px;line-height:normal">{{ getFirstName(user.$key) }}{{ (user.leader? " *" : "") }}{{getUserFollowing(user.$key,currentTeamID)?"":" (Not Following)"}}</div>
    </li>
  </ul>
  <ul class='listLight'>
    <li class='userIcon' *ngFor="let user of teamMembers | async" (click)="db.object('userInterface/'+currentUserID).update({focusUser: user.$key});router.navigate(['userProfile'])">
      <img *ngIf="!user.leader" (error)="errorHandler($event)"[src]="getPhotoURL(user.$key)" style="margin:5px;border-radius:3px; object-fit: cover; height:60px; width:60px">
      <div *ngIf="!user.leader" style="font-size:10px;line-height:normal">{{ getFirstName(user.$key) }}{{ (user.leader? " *" : "") }}{{getUserFollowing(user.$key,currentTeamID)?"":" (Not Following)"}}</div>
    </li>
  </ul>
  </div>
  </div>
  <ul>
    <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="db.object('userInterface/'+currentUserID).update({focusProject: project.$key});router.navigate(['projectProfile'])">
      <img (error)="errorHandler($event)"[src]="getProjectPhotoURL(project.$key)" style="object-fit: cover; height:125px; width:125px">
      <div style="height:25px;font-size:10px;line-height:10px">{{getProjectName(project.$key)}}{{(getTeamLeader(project.$key,currentTeamID)? " **" : "")}}</div>
    </li>
  </ul>
  <button [hidden]='!getUserLeader(currentTeamID)' (click)="this.router.navigate(['followProject'])" style="background-color:#c69b00">Follow a project</button>
  <button [hidden]='!getUserLeader(currentTeamID)' (click)="this.router.navigate(['createProject'])" style="background-color:#c69b00">Create a project</button>
  <div style="clear: left; width: 50%;">
  <input maxlength="500" [(ngModel)]="teamName" style="text-transform: uppercase;" placeholder="Enter team name" />
  <input maxlength="500" [(ngModel)]="photoURL" placeholder="Paste image from the web" />
  <button (click)="saveTeamProfile()">Save team profile {{messageSaveTeamProfile}}</button>
  </div>
  <div style="float: right;">
    <ul class='listLight' [hidden]='!getUserLeader(currentTeamID)'>
      <li (click)="this.router.navigate(['addMember'])">
        <div class='cornerButton' style="float:right">+</div>
      </li>
      <li (click)="db.object('teamAds/'+currentTeamID).update({memberAdVisible:!memberAdVisible})">
        <div class='cornerButton' style="float:right">Ad</div>
      </li>
    </ul>
  </div>
  <div style="clear:left">
    <textarea [hidden]='!memberAdVisible' class="textAreaAdvert" style="max-width:400px" rows="10" maxlength="500" [(ngModel)]="memberAdText" (keyup)="updateMemberAdDB()" placeholder="Looking for new Members or Leaders for your team? Write an advert here."></textarea>
    <div style="text-align:left; cursor:pointer; color:blue; padding:10px;" (click)="router.navigate(['teamAds'])">View all Ads</div>
  </div>
  </div>
`,
})
export class UsersComponent  {

  photoURL: string;
  teamName: string;
  editMode: boolean;
  messageSaveTeamProfile: string;
  currentUserID: string;
  currentTeamID: string;
  teamLeaders: FirebaseListObservable<any>;
  teamMembers: FirebaseListObservable<any>;
  teamProjects: FirebaseListObservable<any>;
  newMemberID: string;
  memberAdText: string;
  memberAdVisible: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      this.memberAdVisible=false;
      if (auth==null){
      }
      else {
        this.editMode = false;
        this.currentUserID = auth.uid;
        this.db.object('userInterface/'+auth.uid+'/currentTeam').subscribe(currentTeam => {
          this.currentTeamID = currentTeam.$value;
          this.db.object('teams/' + this.currentTeamID).subscribe (team=>{
            this.teamName = team.name;
            this.photoURL = team.photoURL;
          });
          this.db.object('teamAds/'+this.currentTeamID+'/memberAdText').subscribe(memberAdText => {
            this.memberAdText = memberAdText.$value;
          });
          this.db.object('teamAds/'+this.currentTeamID+'/memberAdVisible').subscribe(memberAdVisible => {
            this.memberAdVisible = memberAdVisible.$value;
          });
          this.teamProjects = this.db.list('teamProjects/' + currentTeam.$value, {
            query:{
              orderByChild:'following',
              equalTo: true,
            }
          });
          this.teamLeaders = this.db.list('teamUsers/' + currentTeam.$value, {
            query:{
              orderByChild:'leader',
              equalTo: true,
            }
          });
          this.teamMembers = this.db.list('teamUsers/' + currentTeam.$value, {
            query:{
              orderByChild:'member',
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

  getFirstName (ID: string) :string {
    var output;
    if (ID == this.currentUserID) { output = "me"} else {
      this.db.object('users/' + ID).subscribe(snapshot => {
        output = snapshot.firstName;
      });
    }
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
    this.db.object('users/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  getProjectPhotoURL (ID: string) :string {
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

  saveTeamProfile() {
    this.teamName = this.teamName.toUpperCase();
    this.db.object('teams/' + this.currentTeamID).update({
      name: this.teamName, photoURL: this.photoURL,
    })
    .then(_ => this.messageSaveTeamProfile="Saved")
    .catch(err => this.messageSaveTeamProfile="Error: Only leaders can save team profile");

  }

  updateMemberAdDB () {
    this.db.object('teamAds/'+this.currentTeamID).update({
      memberAdText:this.memberAdText,
      memberAdTimestamp:firebase.database.ServerValue.TIMESTAMP,
    });
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

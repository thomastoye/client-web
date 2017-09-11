import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'userProfile',
  template: `
  <div class="sheet">
  <div style="float: left; width: 60%;">
  <div class="buttonDiv" *ngIf='!editMode' style="border-style:none;float:right" [hidden]='!ownProfile' (click)="editMode=true">Edit</div>
  <div class="buttonDiv" *ngIf='editMode' style="color:red;border-style:none;float:right" [hidden]='!ownProfile' (click)="editMode=false;updateUserProfile()">Save profile</div>
  <div [hidden]="!leaderStatus" class="leaderStatus">{{memberStatus}}</div>
  <div [hidden]="leaderStatus" class="memberStatus">{{memberStatus}}</div>
  <div [hidden]='editMode'>
  <div class='title'>{{firstName}} {{lastName}}</div>
  <div style="padding:10px;" [innerHTML]="resume | linky"></div>
  </div>
  <div [hidden]='!editMode'>
  <input maxlength="20" [(ngModel)]="firstName" style="text-transform: lowercase; font-weight:bold;" placeholder="first name *" />
  <input maxlength="20" [(ngModel)]="lastName" style="text-transform: lowercase; font-weight:bold;" placeholder="last name *" />
  <input maxlength="140" [(ngModel)]="resume" placeholder="Your resume (140 characters max) *" />
  <input maxlength="500" [(ngModel)]="photoURL" placeholder="Image address from the web *" />
  </div>
  </div>
  <div style="float: right; width: 40%;position:relative">
  <img (error)="errorHandler($event)" [src]="photoURL" style="background-color:#0e0e0e;object-fit:contain; height:175px; width:100%">
  <div *ngIf="editMode" style="position:absolute;left:10px;top:10px;">
  <input type="file" name="projectImage" id="projectImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
  <label for="projectImage" id="buttonFile">
  <img src="./../assets/App icons/camera.png" style="width:25px">
  </label>
  </div>
  </div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">{{firstName}} follows:</div>
  <div class="buttonDiv" *ngIf="currentUserID==focusUserID" style="float:right;margin:5px" (click)="this.router.navigate(['createTeam'])">New team</div>
  <div class="buttonDiv" style="color:red" [hidden]='!editMode' (click)="unfollow(currentTeamID)">Unfollow</div>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === currentTeamID"
      (click)="db.object('userInterface/'+currentUserID).update({currentTeam: team.$key})">
      <div style="display: inline; float: left; height:30px; width:30px" (click)="db.object('userInterface/'+currentUserID).update({currentTeam: team.$key});router.navigate(['chat'])">
      <div class="activity" [hidden]="!getChatActivity(team.$key)"></div>
      </div>
      <img (error)="errorHandler($event)" [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 0;object-fit:cover;height:30px;width:30px" (click)="db.object('userInterface/'+currentUserID).update({currentTeam: team.$key});router.navigate(['teamProfile'])">
      <div style="width:15px;height:25px;float:left;">{{getUserLeader(team.$key,focusUserID)?"*":""}}</div>
      <div style="width:200px;height:25px;float:left;">{{getTeamName(team.$key)}}</div>
    </li>
  </ul>
  <div class="buttonDiv" *ngIf="currentUserID==focusUserID" style="color:red" (click)="this.logout();router.navigate(['login']);">logout</div>
  </div>
  `,
})
export class UserProfileComponent {
  currentUserID: string;
  focusUserID: string;
  firstName: string;
  lastName: string;
  resume: string;
  photoURL: string;
  editMode: boolean;
  currentTeamID: string;
  memberStatus: string;
  leaderStatus: boolean;
  ownProfile: boolean;
  userTeams: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.editMode = false;
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        db.object('userInterface/'+auth.uid).subscribe(userInterface=>{
          this.currentTeamID = userInterface.currentTeam;
          this.focusUserID = userInterface.focusUser;
          this.ownProfile = (this.currentUserID == this.focusUserID);
          db.object('users/' + this.focusUserID).subscribe(focusUser => {
            this.firstName = focusUser.firstName;
            this.lastName = focusUser.lastName;
            this.resume = focusUser.resume;
            this.photoURL = focusUser.photoURL;
            db.object('teamUsers/' + this.currentTeamID+"/"+this.focusUserID).subscribe(teamFocusUser => {
              db.object('userTeams/'+this.focusUserID+'/'+this.currentTeamID).subscribe(focusUserTeam=>{
                this.leaderStatus = teamFocusUser.leader;
                if (focusUserTeam.following) {
                  this.memberStatus = teamFocusUser.leader ? "Leader" : "Member";
                }
                else {
                  this.memberStatus = teamFocusUser.leader ? "Leader (Not Following)" : "Member (Not Following)";
                }
              });
            });
          });
          this.userTeams = db.list('userTeams/' + this.focusUserID, {
            query:{
              orderByChild:'following',
              equalTo: true,
            }
          });
        });
      }
    });
  }

  updateUserProfile() {
    this.firstName = this.firstName.toLowerCase();
    this.lastName = this.lastName.toLowerCase();
    this.db.object('users/'+this.focusUserID).update({
      firstName: this.firstName, lastName: this.lastName, photoURL: this.photoURL, resume: this.resume
    });
    this.editMode=false;
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

  onImageChange(event) {
  }

  logout() {
    this.afAuth.auth.signOut()
  }

  getChatActivity (ID: string) :boolean {
    var output = false;
    this.db.object('userTeams/' + this.currentUserID + '/' + ID).subscribe(userTeam => {
      this.db.object('teamActivities/' + ID).subscribe(teamActivities => {
        output = teamActivities.lastMessageTimestamp > userTeam.lastChatVisitTimestamp;
      });
    });
    return output;
  }

  unfollow(teamID: string) {
    this.db.object('userTeams/'+this.currentUserID+'/'+teamID).update({following:false});
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

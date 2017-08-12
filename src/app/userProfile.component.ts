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
  <div style="float: left; width: 50%;">
  <div [hidden]="!leaderStatus" class="leaderStatus">{{memberStatus}}</div>
  <div [hidden]="leaderStatus" class="memberStatus">{{memberStatus}}</div>
  <div [hidden]='editMode'>
  <div class='title'>{{firstName}} {{lastName}}</div>
  <div style="padding:10px;">{{resume}} {{resume?"":"Add a resume here..."}}</div>
  <button [hidden]='!ownProfile' (click)="editMode=true">Edit profile</button>
  <button [hidden]='!getUserLeader(currentTeamID,currentUserID)' (click)="cancelMember(currentTeamID, focusUserID)" style="background:#e04e4e">Cancel team membership {{messageCancelMembership}}</button>
  </div>
  <div [hidden]='!editMode'>
  <input maxlength="20" [(ngModel)]="firstName" style="text-transform: lowercase; font-weight:bold;" placeholder="first name *" />
  <input maxlength="20" [(ngModel)]="lastName" style="text-transform: lowercase; font-weight:bold;" placeholder="last name *" />
  <input maxlength="140" [(ngModel)]="resume" placeholder="Your resume (140 characters max) *" />
  <input maxlength="500" [(ngModel)]="photoURL" placeholder="Image address from the web *" />
  <button (click)="updateUserProfile()">Save profile</button>
  </div>
  </div>
  <div style="float: right; width: 50%;">
  <img (error)="errorHandler($event)" [src]="photoURL" style="object-fit:contain; height:200px; width:100%">
  </div>
  <div style="height:30px;width:100%"></div>
  <ul class="listLight">
    <div class="listSeperator">{{firstName}} follows:</div>
    <li *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === selectedTeamID"
      (click)="selectedTeamID = team.$key">
      <img (error)="errorHandler($event)" [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
      <div style="width:15px;height:25px;float:left;">{{getUserLeader(team.$key,focusUserID)?"*":""}}</div>
      <div style="width:200px;height:25px;float:left;">{{getTeamName(team.$key)}}</div>
      <div [hidden]='team.$key!=selectedTeamID' style="float:right">
      <div class="button" (click)="db.object('userInterface/'+currentUserID).update({currentTeam: team.$key})">Visit</div>
      <div class="button" (click)="followTeam(selectedTeamID,currentUserID)">Follow</div>
      </div>
    </li>
  </ul>
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
  messageCancelMembership: string;
  ownProfile: boolean;
  userTeams: FirebaseListObservable<any>;
  selectedTeamID: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        db.object('userInterface/'+auth.uid).subscribe(userInterface=>{
          this.currentTeamID = userInterface.currentTeam;
          this.focusUserID = userInterface.focusUser;
          this.ownProfile = (this.currentUserID == this.focusUserID);
          this.messageCancelMembership = ""
          db.object('users/' + this.focusUserID).subscribe(focusUser => {
            this.firstName = focusUser.firstName;
            this.lastName = focusUser.lastName;
            this.resume = focusUser.resume;
            this.photoURL = focusUser.photoURL;
            this.editMode = false;
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

  cancelMember(teamID: string, userID: string) {
    this.db.object('teamUsers/' + teamID + '/' + userID).update({member:false})
    .then(_ => this.router.navigate(['teams']))
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
      this.router.navigate(['teams']);
    }
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

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
  <div style="padding:10px; font-weight: bold; font-size: 16px">{{firstName}} {{lastName}}</div>
  <div style="padding:10px;">{{resume}} {{resume?"":"Add a resume here..."}}</div>
  <button [hidden]='!ownProfile' (click)="editMode=true">Edit profile</button>
  <button (click)="cancelMember(currentTeamID, focusUserID)" style="background:#e04e4e">Cancel team membership {{messageCancelMembership}}</button>
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
  <img [src]="photoURL" style="object-fit:contain; height:200px; width:100%">
  </div>
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
    .then(_ => this.router.navigate(['teamSettings']))
    .catch(err => this.messageCancelMembership="Error: Only a leader can cancel a membership - A leader's membership cannot be cancelled");
  }

}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'userProfile',
  template: `
  <div class="user">
  <div style="float: left; width: 50%;">
  <div class="memberStatus">{{this.memberStatus}}</div>
  <input maxlength="500" [(ngModel)]="this.firstName" style="text-transform: lowercase;" placeholder="Enter first name" />
  <input maxlength="500" [(ngModel)]="this.lastName" style="text-transform: lowercase;" placeholder="Enter last name" />
  <input maxlength="500" [(ngModel)]="this.photoURL" placeholder="Paste image from the web" />
  <hr>
  <button (click)="updateUserProfile()">Save profile</button>
  <button (click)="cancelMember(currentTeamID, focusUserID)" style="color:red">Cancel team membership {{message1}}</button>
  </div>
  <div style="float: right; width: 50%;">
  <img [src]="this.photoURL" style="object-fit:contain; height:200px; width:100%">
  </div>
  </div>
  `,
})
export class UserProfileComponent {
  currentUserID: string;
  focusUserID: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  currentTeamID: string;
  memberStatus: string;
  message1: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        db.object('userInterface/'+auth.uid).subscribe(userInterface=>{
          this.currentTeamID = userInterface.currentTeam;
          this.focusUserID = userInterface.focusUser;
          db.object('users/' + this.focusUserID).subscribe(focusUser => {
            this.firstName = focusUser.firstName;
            console.log(this.firstName);
            this.lastName = focusUser.lastName;
            this.photoURL = focusUser.photoURL;
            db.object('teamUsers/' + this.currentTeamID+"/"+this.focusUserID).subscribe(teamFocusUser => {
              db.object('userTeams/'+this.focusUserID+'/'+this.currentTeamID).subscribe(focusUserTeam=>{
                if (focusUserTeam.following) {
                  this.memberStatus = teamFocusUser.leader ? "Leader" : "Member";
                }
                else {
                  this.memberStatus = teamFocusUser.leader ? "Leader (Not Following)" : "Member (Not Following)";
                }
                console.log(this.memberStatus);
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
      firstName: this.firstName, lastName: this.lastName, photoURL: this.photoURL
    });
  }

  cancelMember(teamID: string, userID: string) {
    this.db.object('teamUsers/' + teamID + '/' + userID).update({member:false})
    .then(_ => this.router.navigate(['teamSettings']))
    .catch(err => this.message1="Error: Only a leader can cancel a membership - A leader's membership cannot be cancelled");
  }

}

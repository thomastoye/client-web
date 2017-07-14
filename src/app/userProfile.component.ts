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
  <hr>
  <input [(ngModel)]="this.firstName" style="text-transform: lowercase;" placeholder="Enter first name" />
  <input [(ngModel)]="this.lastName" style="text-transform: lowercase;" placeholder="Enter last name" />
  <input [(ngModel)]="this.photoURL" placeholder="Paste image from the web" />
  <hr>
  <button (click)="updateUserProfile()">Save profile</button>
  <button (click)="removeMember(currentTeamID, focusUserID)" style="color:red">Remove from this team</button>
  </div>
  <div style="float: right; width: 50%;">
  <img [src]="this.photoURL" style="object-fit:contain; height:200px; width:100%" routerLink="/user" routerLinkActive="active">
  </div>
  </div>
  `,
})
export class UserProfileComponent {
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  focusUser: FirebaseObjectObservable<any>;
  focusTeamUser: FirebaseObjectObservable<any>;
  focusUserID: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  currentTeamID: string;
  memberStatus: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
        if (auth == null) {
          this.focusUserID = "";
          this.currentUserID = "";
          this.firstName = "";
          this.lastName = "";
          this.photoURL = "./../assets/App icons/me.png";
          this.currentTeamID = "";
          this.memberStatus = "";
        }
        else {
          db.object('users/' + auth.uid).subscribe( snapshot => {
            this.currentUserID = auth.uid;
            this.currentUser = db.object('users/' + this.currentUserID);
            this.focusUserID = snapshot.focusUserID;
            this.focusUser = db.object('users/' + this.focusUserID);
            this.focusUser.subscribe(snapshot2 => {
              this.firstName = snapshot2.firstName;
              this.lastName = snapshot2.lastName;
              this.photoURL = snapshot2.photoURL;
              this.currentTeamID = snapshot.currentTeam;
            });
            this.focusTeamUser = db.object('teamUsers/' + this.currentTeamID + "/" + this.focusUserID);
            this.focusTeamUser.subscribe(snapshot3 => {
              this.memberStatus = snapshot3.leader ? "Leader" : "Member";
            });
          });
        }
    });
  }

  updateUserProfile() {
    this.firstName = this.firstName.toLowerCase();
    this.lastName = this.lastName.toLowerCase();
    this.focusUser.update({
      firstName: this.firstName, lastName: this.lastName, photoURL: this.photoURL
    });
  }

  removeMember(teamID: string, userID: string) {
    this.db.list('teamUsers/' + teamID).remove(userID);
    this.router.navigate(['teamSettings']);
  }

}

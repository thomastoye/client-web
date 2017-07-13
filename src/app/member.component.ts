import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'member',
  template: `
  <ul class="members" style="float: left;">
    <li *ngFor="let user of teamUsers | async" style="text-align: center; float: left; width: 60px; margin: 0 5px 20px 0; padding-top: 5px">
      <img [src]="getPhotoURL(user.$key)" (click)="currentUser.update({focusUserID: user.$key})" style="border-radius:3px; object-fit: cover; height:45px; width:45px" routerLink="/user" routerLinkActive="active">
      <div style="font-size: 9px; color: #FFF;">{{ getFirstName(user.$key) }}{{ (user.leader? " *" : "") }}</div>
    </li>
  </ul>
`,
})
export class MemberComponent  {

  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  firstName= "";
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  teamUsers: FirebaseListObservable<any>;
  newMemberID: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth == null) {
        this.currentUserID = "";
        this.currentTeamID = "";
        this.teamUsers = null;
      }
      else {
        this.currentUserID = auth.uid;
        this.currentUser = db.object('users/' + (auth ? auth.uid : "logedout"));
        this.currentUser.subscribe(snapshot => {
          this.currentTeamID = snapshot.currentTeam;
          this.teamUsers = this.db.list('teamUsers/' + this.currentTeamID);
        });
      }
    });
  }

  getFirstName (ID: string) :string {
    var output;
    if (ID == this.currentUserID) { output = "Me"} else {
      this.db.object('users/' + ID).subscribe(snapshot => {
        output = snapshot.firstName;
      });
    }
    return output;
  }

  getPhotoURL (ID: string) :string {
    var output;
    this.db.object('users/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

}

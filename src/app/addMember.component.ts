import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';

@Component({
  selector: 'addMember',
  template: `
  <ul class="teams">
  <h6 style="padding:7px; color:#AAA;">ALL USERS</h6>
    <li *ngFor="let user of users | async"
      [class.selected]="user.$key === selectedUserID"
      (click)="selectedUserID = user.$key">
      <img [src]="user.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; border-radius:4px; object-fit: cover; height:25px; width:25px">
      {{user.firstName}}
      {{user.lastName}}
    </li>
  </ul>
  <button (click)="addMember(currentTeamID, selectedUserID)">Add this member</button>
  `,
})

export class AddMemberComponent  {

  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  firstName: string;
  photoURL: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  selectedUserID: string;
  userTeams: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  teamUsers: FirebaseListObservable<any>;
  users: FirebaseListObservable<any>;
  newMemberID: string;
  joinTeamID: string;
  newTeam: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      this.currentUserID = auth.uid;
      this.currentUser = db.object('users/' + (auth ? auth.uid : "logedout"));
      this.currentUser.subscribe(snapshot => {
        this.firstName = snapshot.firstName;
        this.photoURL = snapshot.photoURL;
        this.currentTeamID = snapshot.currentTeam;
        this.currentTeam = db.object('teams/' + this.currentTeamID);
      });
      this.userTeams = db.list('userTeams/' + (auth ? auth.uid : "logedout"), {
        query:{orderByChild:'name'}
      });
    });
    this.users = db.list('users/', {
      query:{orderByChild:'firstName'}
    });
  }

  addMember (teamID: string, memberID: string) {
    this.db.list('teamUsers/' + teamID).update(memberID, {leader: false});
    this.router.navigate(['team']);
  }

}

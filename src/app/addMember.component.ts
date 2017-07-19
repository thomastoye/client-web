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
  <input maxlength="500" (keydown.enter)="refreshUserList()" style="text-transform: lowercase;" [(ngModel)]="this.filter" placeholder="Enter exact first name and press enter">
    <li *ngFor="let user of users | async"
      [class.selected]="user.$key === selectedUserID"
      (click)="selectedUserID = user.$key">
      <img [src]="user.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:40px; width:40px">
      {{user.firstName}}
      {{user.lastName}}
    </li>
  </ul>
  <button (click)="addMember(currentTeamID, selectedUserID)">Add this member {{messageAddMember}}</button>
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
  teams: FirebaseListObservable<any>;
  teamUsers: FirebaseListObservable<any>;
  users: FirebaseListObservable<any>;
  newMemberID: string;
  joinTeamID: string;
  newTeam: string;
  filter: string;
  messageAddMember: string;

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
    });
    this.users = db.list('users/', {
      query:{
        limitToFirst: 0,
      }
    });
  }

  refreshUserList () {
    this.filter = this.filter.toLowerCase();
    this.users = this.db.list('users/', {
      query:{
        orderByChild:'firstName',
        equalTo: this.filter,
      }
    });
  }

  addMember (teamID: string, memberID: string) {
    this.teamUsers = this.db.list('teamUsers/' + teamID);
    this.teamUsers.update(memberID, {member: true, leader: false})
    .then(_ => this.router.navigate(['teamSettings']))
    .catch(err => this.messageAddMember="Error: You need to be leader to add a Member");
  }

}

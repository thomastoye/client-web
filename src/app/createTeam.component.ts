import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'createTeam',
  template: `
  <div class="user">
  <div style="float: left; width: 50%;">
  <hr>
  <input maxlength="500" [(ngModel)]="this.newTeam" style="text-transform: uppercase;" placeholder="Enter team name" />
  <input maxlength="500" [(ngModel)]="this.photoURL" placeholder="Paste image from the web" />
  <hr>
  <button (click)="createNewTeam()">Create team</button>
  </div>
  <div style="float: right; width: 50%;">
  <img [src]="this.photoURL" style="object-fit:contain; height:200px; width:100%" routerLink="/user" routerLinkActive="active">
  </div>
  </div>
  `,
})
export class CreateTeamComponent {
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  photoURL: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  teamUsers: FirebaseListObservable<any>;
  followTeamID: string;
  newTeam: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      this.currentUserID = auth.uid;
    });
  }

  createNewTeam() {
    this.newTeam = this.newTeam.toUpperCase();
    var teamID = this.db.list('ids/').push(true).key;
    this.teamUsers = this.db.list('teamUsers/' + teamID);
    this.teamUsers.update(this.currentUserID, {member: true, leader: true});
    this.teams = this.db.list('teams/');
    this.teams.update(teamID, {name: this.newTeam, photoURL: this.photoURL, organisation: "Family and Friends"});
    this.userTeams = this.db.list('userTeams/' + this.currentUserID);
    this.userTeams.update(teamID, {following: true});
    this.currentUser = this.db.object('users/' + this.currentUserID);
    this.currentUser.update({currentTeam: teamID});
    this.router.navigate(['teamSettings']);
  }

}

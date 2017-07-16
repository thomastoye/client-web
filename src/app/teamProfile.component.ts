import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'teamProfile',
  template: `
  <div class="user">
  <div style="float: left; width: 50%;">
  <hr>
  <input maxlength="500" [(ngModel)]="this.teamName" style="text-transform: uppercase;" placeholder="Enter team name" />
  <input maxlength="500" [(ngModel)]="this.photoURL" placeholder="Paste image from the web" />
  <hr>
  <button (click)="saveTeamProfile()">Save team profile {{messageSaveTeamProfile}}</button>
  </div>
  <div style="float: right; width: 50%;">
  <img [src]="this.photoURL" style="object-fit:contain; height:200px; width:100%" routerLink="/user" routerLinkActive="active">
  </div>
  </div>
  `,
})
export class TeamProfileComponent {
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  photoURL: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  teamUsers: FirebaseListObservable<any>;
  followTeamID: string;
  teamName: string;
  messageSaveTeamProfile: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      this.currentUserID = auth.uid;
      this.currentUser = db.object('users/' + (auth ? auth.uid : "logedout"));
      this.currentUser.subscribe(snapshot => {
        this.currentTeamID = snapshot.currentTeam;
        this.currentTeam = db.object('teams/' + this.currentTeamID);
        this.currentTeam.subscribe ((team) => {
          this.teamName = team.name;
          this.photoURL = team.photoURL;
        });
      });
    });
  }

  saveTeamProfile() {
    this.teamName = this.teamName.toUpperCase();
    this.currentTeam.update({
      name: this.teamName, photoURL: this.photoURL,
    })
    .then(_ => this.router.navigate(['teamSettings']))
    .catch(err => this.messageSaveTeamProfile="Error: Only leaders can save team profile");

  }

}

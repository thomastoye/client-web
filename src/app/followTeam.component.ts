import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';

@Component({
  selector: 'followTeam',
  template: `
  <ul class="teams">
  <input (keydown.enter)="refreshTeamList()" [(ngModel)]="this.filter" style="text-transform:uppercase" placeholder="Search exact team name">
    <li *ngFor="let team of teams | async"
      [class.selected]="team.$key === selectedTeamID"
      (click)="selectedTeamID = team.$key">
      {{team.name}}
    </li>
  </ul>
  <button (click)="followTeam(selectedTeamID, currentUserID)">Follow this team</button>
  `,
})

export class FollowTeamComponent  {

  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  firstName: string;
  photoURL: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  selectedTeamID: string;
  userTeams: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  teamUsers: FirebaseListObservable<any>;
  users: FirebaseListObservable<any>;
  newMemberID: string;
  followTeamID: string;
  newTeam: string;
  filter: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      this.currentUserID = auth.uid;
      this.currentUser = db.object('users/' + (auth ? auth.uid : "logedout"));
      this.currentUser.subscribe(snapshot => {
        this.currentTeamID = snapshot.currentTeam;
      });
    });
    this.teams = this.db.list('teams/', {
      query:{
        orderByChild:'name',
      }
    });
  }

  refreshTeamList () {
    this.filter = this.filter.toUpperCase();
    this.teams = this.db.list('teams/', {
      query:{
        orderByChild:'name',
        equalTo: this.filter,
      }
    });
  }

  followTeam (teamID: string, userID: string) {
    this.db.list('userTeams/' + userID).update(teamID, {status: "confirmed"});
    this.db.list('users/').update(userID, {currentTeam: teamID});
    this.router.navigate(['team']);
  }

}

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
  <h6 style="padding:7px; color:#AAA;">ALL TEAMS</h6>
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
    this.teams = db.list('teams/', {
      query:{orderByChild:'name'}
    });
  }

  followTeam (teamID: string, userID: string) {
    this.db.list('userTeams/' + userID).update(teamID, {status: "confirmed"});
    this.db.list('users/').update(userID, {currentTeam: teamID});
    this.router.navigate(['team']);
  }

}

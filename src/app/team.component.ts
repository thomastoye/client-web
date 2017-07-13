import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'team',
  template: `
  <ul class="teams">
    <h6 style="padding:7px; color:#AAA;">MY TEAMS</h6>
    <li *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === currentTeamID"
      (click)="currentUser.update({currentTeam: team.$key})">
      {{getTeamName(team.$key)}}
    </li>
  </ul>
  <div>
  <div style="float: right; width: 50%;">
  <button (click)="this.router.navigate(['followTeam'])">Follow a team...</button>
  </div>
  </div>
  <div>
  <div style="float: left; width: 50%;">
  <input [(ngModel)]="this.newTeam" style="text-transform:uppercase" placeholder="Team name" />
  </div>
  <div style="float: right; width: 50%;">
  <button (click)="createNewTeam()">Create a new team...</button>
  </div>
  </div>
  <div class="teamProfile">
  <div class="titleSeperator">{{ (currentTeam | async)?.name }}</div>
  <div>
  <div style="float: right; width: 50%;">
  <button (click)="this.router.navigate(['addMember'])">Add a member to this team...</button>
  </div>
  </div>
  <div class="titleSeperator">ORGANISTION</div>
  <div>
  <div style="float: left; width: 50%;">
  <div>This team is part of</div>
  </div>
  <div style="float: right; width: 50%; text-align: right;">
  <div>{{ (currentTeam | async)?.organisation }}</div>
  </div>
  </div>
  <div class="titleSeperator">PROJECTS</div>
  <div>Add a new project...</div>
  <div style="float: right; width: 50%;">
  <button (click)="leaveTeam(currentTeamID)" style="background-color:#d65555">Leave this team</button>
  </div>
  </div>
  `,
})

export class TeamComponent  {

  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  firstName: string;
  photoURL: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  teamUsers: FirebaseListObservable<any>;
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
    this.teams = db.list('teams/');
  }

  createNewTeam() {
    this.newTeam = this.newTeam.toUpperCase();
    var teamID = this.db.list('ids/').push(true).key;
    this.teamUsers = this.db.list('teamUsers/' + teamID);
    this.teamUsers.update(this.currentUserID, {leader: true});
    this.teams.update(teamID, {name: this.newTeam, organisation: "Family and Friends"});
    this.userTeams.update(teamID, {status: "confirmed"});
    this.currentUser.update({currentTeam: teamID});
    this.db.list('ids/').remove();
  }

  followTeam() {
    this.userTeams.update(this.followTeamID, {status: "confirmed"});
    this.currentUser.update({currentTeam: this.followTeamID});
  }

  getTeamName (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  leaveTeam(teamID: string) {
    this.userTeams.remove(teamID);
  }

  addTeamMember(teamID: string, memberID: string) {
    this.teamUsers = this.db.list('teamUsers/' + teamID);
    this.teamUsers.update(memberID, {leader: false});
  }

}

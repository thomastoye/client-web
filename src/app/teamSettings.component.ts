import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'teamSettings',
  template: `
  <ul class="teams">
    <h6 style="padding:7px; color:#AAA;">MY TEAMS</h6>
    <li *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === currentTeamID"
      (click)="currentUser.update({currentTeam: team.$key})">
      {{getTeamName(team.$key)}}
    </li>
  </ul>
  <div class="teamProfile">
  <div style="float: left; width: 50%;">
  <button (click)="this.router.navigate(['followTeam'])">Follow a team</button>
  <button (click)="createNewTeam()">Create a new team</button>
  <button (click)="this.router.navigate(['addMember'])">Add a member</button>
  </div>
  <div class="titleSeperator">ORGANISTION</div>
  <div style="float: left; width: 50%;">
  <button>{{ (currentTeam | async)?.organisation }}</button>
  </div>
  <div class="titleSeperator">PROJECTS</div>
  <div style="float: left; width: 50%;">
  <button>Add a project (coming soon)</button>
  <button (click)="leaveTeam(currentTeamID)" style="color:red">Leave this team</button>
  </div>
  </div>
  `,
})

export class TeamSettingsComponent  {

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
      this.userTeams = db.list('userTeams/' + (auth ? auth.uid : "logedout"));
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

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'createTeam',
  template: `
  <div class="sheet">
  <div style="float: left; width: 50%;">
  <input maxlength="500" [(ngModel)]="newTeam" style="text-transform: uppercase;" placeholder="Enter team name *" />
  <input maxlength="500" [(ngModel)]="photoURL" placeholder="Paste image from the web *" />
  <button (click)="createNewTeam(currentUserID, newTeam)">Create team</button>
  </div>
  <div style="float: right; width: 50%;">
  <img (error)="errorHandler($event)"[src]="this.photoURL" style="object-fit:contain; height:200px; width:100%" routerLink="/user" routerLinkActive="active">
  </div>
  </div>
  `,
})
export class CreateTeamComponent {
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  photoURL: string;
  newTeam: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
      }
    });
  }

  createNewTeam(userID: string, teamName: string) {
    teamName = teamName.toUpperCase();
    var teamID = this.db.list('ids/').push(true).key;
    this.db.object('teamUsers/'+teamID+'/'+userID).update({member: true, leader: true});
    this.db.object('teams/'+teamID).update({name: teamName, photoURL: this.photoURL, organisation: "Family and Friends"});
    this.db.object('userTeams/'+userID+'/'+teamID).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
    this.db.object('userInterface/' + userID).update({currentTeam: teamID});
    this.router.navigate(['teamSettings']);
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

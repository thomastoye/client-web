import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'addTeam',
  template: `
  <div class='sheet'>
  <ul class="listLight">
  <input maxlength="500" (keyup)="refreshTeamList()" [(ngModel)]="this.filter" style="text-transform:uppercase" placeholder="search team name">
    <li *ngFor="let team of teams | async"
      [class.selected]="team.$key === selectedTeamID"
      (click)="selectedTeamID = team.$key">
      <img (error)="errorHandler($event)"[src]="team.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{team.name}}
    </li>
  </ul>
  <button (click)="addTeam(selectedTeamID, UI.focusProject)">Add this team {{messageFollow}}</button>
  </div>
  `,
})

export class AddTeamComponent  {

  selectedTeamID: string;
  filter: string;
  teams: FirebaseListObservable<any>;
  messageFollow: string;

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService) {
  }

  refreshTeamList () {
    this.filter = this.filter.toUpperCase();
    if (this.filter.length>1) {
    this.teams = this.db.list('teams/', {
      query:{
        orderByChild:'name',
        startAt: this.filter,
        endAt: this.filter+"\uf8ff",
        limitToFirst: 10
      }
    });
  }
  else this.teams = null;
}

  addTeam (teamID: string, projectID: string) {
    if (teamID==null || teamID=="") {this.messageFollow = "Please select a team"}
    else {
      this.db.object('projectTeams/'+projectID+'/'+teamID).update({member: true, leader: false});
      this.router.navigate(['projectProfile']);
    }
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

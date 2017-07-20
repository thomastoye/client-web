import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';

@Component({
  selector: 'addMember',
  template: `
  <ul class="listDark">
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

  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  selectedUserID: string;
  users: FirebaseListObservable<any>;
  filter: string;
  messageAddMember: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.db.object('userInterface/'+auth.uid).subscribe(userInterface => {
          this.currentTeamID = userInterface.currentTeam;
          this.currentTeam = db.object('teams/' + this.currentTeamID);
        });
        this.users = db.list('users/', {
          query:{
            limitToFirst: 0,
          }
        });
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
    if (memberID==null || memberID=="") {this.messageAddMember = "Please select a member"}
    else {
      this.db.object('teamUsers/'+teamID+'/'+memberID).update({member: true, leader: false})
      .then(_ => this.router.navigate(['teamSettings']))
      .catch(err => this.messageAddMember="Error: You need to be leader to add a Member - You cannot add yourself if you are already in the team");
    }
  }

}

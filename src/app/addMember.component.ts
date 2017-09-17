import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'addMember',
  template: `
 <div class="sheet">
 <ul class="listLight">
  <input id="searchInput" maxlength="500" (keyup)="refreshUserList()" style="text-transform: lowercase;" [(ngModel)]="this.filter" placeholder="search first name">
    <li *ngFor="let user of users | async"
      [class.selected]="user.$key === selectedUserID"
      (click)="selectedUserID = user.$key">
      <img (error)="errorHandler($event)"[src]="user.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:40px; width:40px">
      {{user.firstName}}
      {{user.lastName}}
    </li>
  </ul>
  <button (click)="addMember(UI.currentTeam, selectedUserID)">Add this member {{messageAddMember}}</button>
  </div>
  `,
})

export class AddMemberComponent  {

  selectedUserID: string;
  users: FirebaseListObservable<any>;
  filter: string;
  messageAddMember: string;

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService) {
  }

  ngOnInit () {
    document.getElementById("searchInput").focus();
  }

  refreshUserList () {
    this.filter = this.filter.toLowerCase();
    if (this.filter.length>1) {
      this.users = this.db.list('users/', {
        query:{
          orderByChild:'firstName',
          startAt: this.filter,
          endAt: this.filter+"\uf8ff",
          limitToFirst: 10
        }
      });
    }
    else this.users = null;
  }

  addMember (teamID: string, memberID: string) {
    if (memberID==null || memberID=="") {this.messageAddMember = "Please select a member"}
    else {
      this.db.object('teamUsers/'+teamID+'/'+memberID).update({member: true, leader: false})
      .then(_ => this.router.navigate(['users']))
      .catch(err => this.messageAddMember="Error: You need to be leader to add a Member - You cannot add yourself if you are already in the team");
    }
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

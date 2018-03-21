import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'search',
  template: `
  <div class="sheet">
  <input id="searchInput" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="UI.searchFilter" placeholder="Search">
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Users</div>
  <ul class="listLight">
    <li *ngFor="let user of users | async"
      (click)="router.navigate(['user',user.$key])">
      <img (error)="errorHandler($event)"[src]="user.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div>{{user.firstName}} {{user.lastName}}</div>
      <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="addMessage(user.$key,'',user.$key)">Send to chat</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Teams</div>
  <ul class="listLight">
    <li *ngFor="let team of teams | async"
      (click)="router.navigate(['team',team.$key]);">
      <img (error)="errorHandler($event)"[src]="team.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div>{{team.name}}</div>
      <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="addMessage(team.$key,team.$key,'')">Send to chat</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Projects</div>
  <ul class="listLight">
    <li *ngFor="let project of projects | async"
      (click)="router.navigate(['project',project.$key])">
      <img (error)="errorHandler($event)"[src]="project.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{project.name}}
    </li>
  </ul>
  </div>
  `,
})

export class SearchComponent  {

  users: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  projects: FirebaseListObservable<any>;

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService) {
  }

  ngOnInit () {
    document.getElementById("searchInput").focus();
    this.refreshSearchLists();
  }

  refreshSearchLists () {
    if (this.UI.searchFilter) {
      if (this.UI.searchFilter.length>1) {
        this.users = this.db.list('PERRINNUsers/', {
          query:{
            orderByChild:'firstName',
            startAt: this.UI.searchFilter.toLowerCase(),
            endAt: this.UI.searchFilter.toLowerCase()+"\uf8ff",
            limitToFirst: 10
          }
        });
        this.teams = this.db.list('PERRINNTeams/', {
          query:{
            orderByChild:'name',
            startAt: this.UI.searchFilter.toUpperCase(),
            endAt: this.UI.searchFilter.toUpperCase()+"\uf8ff",
            limitToFirst: 10
          }
        });
        this.projects = this.db.list('projects/', {
          query:{
            orderByChild:'name',
            startAt: this.UI.searchFilter.toUpperCase(),
            endAt: this.UI.searchFilter.toUpperCase()+"\uf8ff",
            limitToFirst: 10
          }
        });
      }
    }
    else {
      this.users = null;
      this.teams = null;
      this.projects = null;
    }
  }

  addMessage(text,linkTeam,linkUser) {
    const now = Date.now();
    this.db.list('teamMessages/'+this.UI.currentTeam).push({
      timestamp:now,
      text:text,
      user:this.UI.currentUser,
      linkTeam:linkTeam,
      linkUser:linkUser,
    });
    this.db.object('teamActivities/'+this.UI.currentTeam).update({
      lastMessageTimestamp:now,
      lastMessageText:text,
      lastMessageUser:this.UI.currentUser,
    });
    this.db.object('userTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).update({
      lastChatVisitTimestamp:now,
      lastChatVisitTimestampNegative:-1*now,
    });
    this.router.navigate(['chat',this.UI.currentTeam])
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

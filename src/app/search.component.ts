import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'search',
  template: `
  <div class="sheet">
  <input id="searchInput" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="Search">
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Users</div>
  <ul class="listLight">
    <li *ngFor="let user of users | async">
      <div style="float:left;width:150px" (click)="router.navigate(['user',user.$key])">
      <img [src]="user.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div>{{user.firstName}} {{user.lastName}}</div>
      </div>
      <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="UI.createMessage(user.$key,'','',{},{key:user.$key,firstName:user.firstName,lastName:user.lastName,imageUrlThumb:user.imageUrlThumb});router.navigate(['chat',this.UI.currentTeam])">Send to chat</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Teams</div>
  <ul class="listLight">
    <li *ngFor="let team of teams | async">
      <div style="float:left;width:150px" (click)="router.navigate(['chat',team.$key])">
      <img [src]="team?.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div>{{team.name}}</div>
      </div>
      <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="UI.createMessage(team.$key,'','',{key:team.$key,name:team.name,imageUrlThumb:team.imageUrlThumb},{});router.navigate(['chat',this.UI.currentTeam])">Send to chat</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Projects</div>
  <ul class="listLight">
    <li *ngFor="let project of projects | async"
      (click)="router.navigate(['project',project.$key])">
      <img [src]="project?.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
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
  searchFilter: string;

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService) {
  }

  ngOnInit () {
    document.getElementById("searchInput").focus();
    this.refreshSearchLists();
  }

  refreshSearchLists () {
    if (this.searchFilter) {
      if (this.searchFilter.length>1) {
        this.users = this.db.list('PERRINNUsers/', {
          query:{
            orderByChild:'firstName',
            startAt: this.searchFilter.toLowerCase(),
            endAt: this.searchFilter.toLowerCase()+"\uf8ff",
            limitToFirst: 10
          }
        });
        this.teams = this.db.list('PERRINNTeams/', {
          query:{
            orderByChild:'name',
            startAt: this.searchFilter.toUpperCase(),
            endAt: this.searchFilter.toUpperCase()+"\uf8ff",
            limitToFirst: 10
          }
        });
        this.projects = this.db.list('projects/', {
          query:{
            orderByChild:'name',
            startAt: this.searchFilter.toUpperCase(),
            endAt: this.searchFilter.toUpperCase()+"\uf8ff",
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

}

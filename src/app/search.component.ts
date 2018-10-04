import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { firebase } from '@firebase/app';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'search',
  template: `
  <div id='main_container'>
  <div class="sheet">
  <input id="searchInput" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="Search">
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Users</div>
  <ul class="listLight">
    <li *ngFor="let user of users | async">
      <div style="float:left;width:150px" (click)="router.navigate(['user',user.key])">
      <img [src]="user.values.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div>{{user.values.firstName}} {{user.values.lastName}}</div>
      </div>
      <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="UI.createMessage(user.key,'','',{},{key:user.key,firstName:user.values.firstName,lastName:user.values.lastName,imageUrlThumb:user.values.imageUrlThumb});router.navigate(['chat',this.UI.currentTeam])">Send to chat</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Teams</div>
  <ul class="listLight">
    <li *ngFor="let team of teams | async">
      <div style="float:left;width:150px" (click)="router.navigate(['chat',team.key])">
      <img [src]="team?.values.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div>{{team.values.name}}</div>
      </div>
      <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="UI.createMessage(team.key,'','',{key:team.key,name:team.values.name,imageUrlThumb:team.values.imageUrlThumb},{});router.navigate(['chat',this.UI.currentTeam])">Send to chat</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  </div>
  </div>
  `,
})

export class SearchComponent  {

  users: Observable<any[]>;
  teams: Observable<any[]>;
  searchFilter: string;

  constructor(public db:AngularFireDatabase,public router:Router,public UI:userInterfaceService) {
  }

  ngOnInit () {
    document.getElementById("searchInput").focus();
    this.refreshSearchLists();
  }

  refreshSearchLists () {
    if (this.searchFilter) {
      if (this.searchFilter.length>1) {
        this.users = this.db.list('PERRINNUsers/',ref=>ref
        .orderByChild('firstName')
        .startAt(this.searchFilter.toLowerCase())
        .endAt(this.searchFilter.toLowerCase()+"\uf8ff")
        .limitToFirst(10))
        .snapshotChanges().map(changes=>{
          return changes.map(c=>({
            key:c.payload.key,
            values:c.payload.val(),
          }));
        });
        this.teams = this.db.list('PERRINNTeams/',ref=>ref
        .orderByChild('name')
        .startAt(this.searchFilter.toUpperCase())
        .endAt(this.searchFilter.toUpperCase()+"\uf8ff")
        .limitToFirst(10))
        .snapshotChanges().map(changes=>{
          return changes.map(c=>({
            key:c.payload.key,
            values:c.payload.val(),
          }));
        });
      }
    }
    else {
      this.users = null;
      this.teams = null;
    }
  }

}

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
  <ul class="listLight">
    <li *ngFor="let team of teams | async">
      <div style="float:left" (click)="router.navigate(['chat',team.key])">
      <img [src]="team?.values.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <span>{{team.values.name}}</span>
      <span style="font-size:10px">{{team.values.familyName}}</span>
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
        this.teams = this.db.list('PERRINNTeams/',ref=>ref
        .orderByChild('name')
        .startAt(this.searchFilter)
        .endAt(this.searchFilter+"\uf8ff")
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
      this.teams = null;
    }
  }

}

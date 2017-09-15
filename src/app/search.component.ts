import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';

@Component({
  selector: 'search',
  template: `
  <div class="sheet">
  <input id="searchInput" maxlength="500" (keyup)="refreshSearchLists()" [(ngModel)]="this.searchFilter" (focusout)="db.object('userInterface/'+currentUserID).update({searchFilter:searchFilter})" placeholder="Search">
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Users</div>
  <ul class="listLight">
    <li *ngFor="let user of users | async"
      [class.selected]="user.$key === selectedUserID"
      (click)="db.object('userInterface/'+currentUserID).update({focusUser: user.$key});router.navigate(['userProfile'])">
      <img (error)="errorHandler($event)"[src]="user.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{user.firstName}}
      {{user.lastName}}
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Teams</div>
  <ul class="listLight">
    <li *ngFor="let team of teams | async"
      [class.selected]="team.$key === selectedTeamID"
      (click)="db.object('userInterface/'+currentUserID).update({currentTeam: team.$key});router.navigate(['teamProfile']);">
      <img (error)="errorHandler($event)"[src]="team.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{team.name}}
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Projects</div>
  <ul class="listLight">
    <li *ngFor="let project of projects | async"
      [class.selected]="project.$key === selectedProjectID"
      (click)="db.object('userInterface/'+currentUserID).update({focusProject: project.$key});router.navigate(['projectProfile'])">
      <img (error)="errorHandler($event)"[src]="project.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{project.name}}
    </li>
  </ul>
  </div>
  `,
})

export class SearchComponent  {

  currentUserID: string;
  currentTeamID: string;
  selectedUserID: string;
  users: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  projects: FirebaseListObservable<any>;
  searchFilter: string;
  messageAddMember: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        this.db.object('userInterface/'+auth.uid).subscribe(userInterface => {
          this.currentTeamID = userInterface.currentTeam;
          this.searchFilter = userInterface.searchFilter;
        });
      }
    });
  }

  ngOnInit () {
    document.getElementById("searchInput").focus();
    this.refreshSearchLists();
  }

  refreshSearchLists () {
    if (this.searchFilter.length>1) {
      this.users = this.db.list('users/', {
        query:{
          orderByChild:'firstName',
          startAt: this.searchFilter.toLowerCase(),
          endAt: this.searchFilter.toLowerCase()+"\uf8ff",
          limitToFirst: 10
        }
      });
      this.teams = this.db.list('teams/', {
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
    else {
      this.users = null;
      this.teams = null;
      this.projects = null;
    }
  }

  addMember (teamID: string, memberID: string) {
    if (memberID==null || memberID=="") {this.messageAddMember = "Please select a member"}
    else {
      this.db.object('teamUsers/'+teamID+'/'+memberID).update({member: true, leader: false})
      .then(_ => this.router.navigate(['teamProfile']))
      .catch(err => this.messageAddMember="Error: You need to be leader to add a Member - You cannot add yourself if you are already in the team");
    }
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'teamAds',
  template: `
  <div class='sheet'>
  <ul class="listLight">
    <li [hidden]="!team.memberAdText" style='float:left;margin:10px' *ngFor="let team of teamAds | async"
      [class.selected]="team.$key === selectedTeamID"
      (click)="selectedTeamID = team.$key;db.object('userInterface/'+currentUserID).update({currentTeam: team.$key})">
      <img (error)="errorHandler($event)" [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 0; opacity: 1; object-fit: cover; height:100px; width:100px">
      <div style="width:15px;height:25px;float:left;">{{getUserLeader(team.$key,currentUserID)?"*":""}}</div>
      <div style="width:200px;height:25px;">{{getTeamName(team.$key)}}</div>
      <div style="height:25px;color:#444">{{getTeamBalance(team.$key) | number:'1.2-2'}} COINS</div>
      <div style="height:25px;color:blue">{{team.memberAdTimestamp | date:'yMd'}}</div>
      <textarea class="textAreaAdvert" readonly rows="10" maxlength="500">{{team.memberAdText}}</textarea>
    </li>
  </ul>
  <div style="color:blue;padding:10px 0 10px 0;cursor:pointer;text-align:center" (click)="teamNumberDisplay=teamNumberDisplay+25;teamAds=db.list('teamAds/',{query:{orderByChild:'memberAdVisible',equalTo:true,limitToFirst:teamNumberDisplay}})">More</div>
  </div>
  `,
})
export class TeamAds {
  currentUserID: string;
  focusUserID: string;
  firstName: string;
  lastName: string;
  resume: string;
  photoURL: string;
  editMode: boolean;
  currentTeamID: string;
  memberStatus: string;
  leaderStatus: boolean;
  messageCancelMembership: string;
  ownProfile: boolean;
  teamAds: FirebaseListObservable<any>;
  selectedTeamID: string;
  totalCOIN: number;
  sheetNumber: number;
  teamNumberDisplay: number;
  loggedIn: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.teamNumberDisplay=25;
    this.sheetNumber=1;
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){this.loggedIn=false}
      else {
        this.loggedIn=true;
        this.currentUserID = auth.uid;
        this.teamAds = db.list('teamAds/', {
          query:{
            orderByChild:'memberAdVisible',
            equalTo: true,
            limitToFirst: this.teamNumberDisplay,
          }
        });
        this.db.object('PERRINNStatistics/totalCOIN').subscribe(totalCOIN => {
          this.totalCOIN = totalCOIN.$value;
        });
      }
    });
  }

  getUserLeader (teamID: string, userID: string) :string {
    var output;
    this.db.object('teamUsers/' + teamID + '/' + userID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  getTeamName (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  getTeamPhotoURL (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  getTeamBalance (ID: string) :string {
    var output;
    this.db.object('PERRINNTeamBalance/' + ID).subscribe(snapshot => {
      output = snapshot.balance;
    });
    return output;
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

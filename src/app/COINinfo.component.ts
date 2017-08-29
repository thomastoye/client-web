import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'COINinfo',
  template: `
  <div class="sheet">
    <div [class.selected]="sheetNumber===1" style="float:left; cursor:pointer; color:blue; padding:15px;" (click)="sheetNumber=1">COIN ownership</div>
    <div [class.selected]="sheetNumber===2" style="float:left; cursor:pointer; color:blue; padding:15px;" (click)="sheetNumber=2">COIN price</div>
    <div [class.selected]="sheetNumber===3" style="float:left; cursor:pointer; color:blue; padding:15px;" (click)="sheetNumber=3">initial COIN offering</div>
  </div>
  <div class="sheet" [hidden]="sheetNumber!=1">
  <div class="title" style="color: black;text-align:left;">There are {{totalCOIN | number:'1.2-2'}} COINS in circulation</div>
  <ul class="listLight">
    <li *ngFor="let team of PERRINNTeamBalance | async"
      [class.selected]="team.$key === selectedTeamID"
      (click)="selectedTeamID = team.$key">
      <img (error)="errorHandler($event)" [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
      <div style="width:15px;height:25px;float:left;">{{getUserLeader(team.$key,currentUserID)?"*":""}}</div>
      <div style="width:200px;height:25px;float:left;">{{getTeamName(team.$key)}}</div>
      <div style="width:80px;height:25px;float:left; text-align:right;">{{team.balance | number:'1.2-2'}}</div>
      <div [hidden]='team.$key!=selectedTeamID' style="float:right">
      <div class="button" (click)="db.object('userInterface/'+currentUserID).update({currentTeam: team.$key})">Visit</div>
      <div class="button" (click)="followTeam(selectedTeamID,currentUserID)">Follow</div>
      </div>
    </li>
  </ul>
  <div style="color:blue;padding:10px 0 10px 0;cursor:pointer;text-align:center" (click)="teamNumberDisplay=teamNumberDisplay+25;PERRINNTeamBalance=db.list('PERRINNTeamBalance/',{query:{orderByChild:'balanceNegative',limitToFirst:teamNumberDisplay}})">More teams</div>
  </div>
  <div class="sheet" [hidden]="sheetNumber!=2">
  <iframe width='100%' height='3000' src="https://goo.gl/urwsGe"></iframe>
  </div>
  <div class="sheet" [hidden]="sheetNumber!=3">
  <iframe width='100%' height='3000' src="https://goo.gl/zqASv7"></iframe>
  </div>
  `,
})
export class COINinfo {
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
  PERRINNTeamBalance: FirebaseListObservable<any>;
  selectedTeamID: string;
  totalCOIN: number;
  sheetNumber: number;
  teamNumberDisplay: number;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.teamNumberDisplay=25;
    this.sheetNumber=1;
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        this.PERRINNTeamBalance = db.list('PERRINNTeamBalance/', {
          query:{
            orderByChild:'balanceNegative',
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

  followTeam (teamID: string, userID: string) {
    if (teamID==null || teamID=="") {return null}
    else {
      this.db.object('userTeams/'+userID+'/'+teamID).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
      this.db.object('userInterface/'+userID).update({currentTeam: teamID});
      this.router.navigate(['teams']);
    }
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

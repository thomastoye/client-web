import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'teamAds',
  template: `
  <div class='sheet'>
  <ul class="listLight">
    <li [hidden]="!team.memberAdText" style='float:left;margin:10px' *ngFor="let team of teamAds | async"
      (click)="router.navigate(['team',team.$key])">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 0; opacity: 1; object-fit: cover; height:100px; width:100px">
      <div style="width:15px;height:25px;float:left;">{{DB.getUserLeader(team.$key,UI.currentUser)?"*":""}}</div>
      <div style="width:200px;height:25px;">{{DB.getTeamName(team.$key)}}</div>
      <div style="height:25px;color:#444">{{getTeamBalance(team.$key) | number:'1.2-2'}} COINS</div>
      <div style="height:25px;color:blue">{{team.memberAdTimestamp | date:'yMd'}}</div>
      <textarea class="textAreaAdvert" readonly rows="10" maxlength="500">{{team.memberAdText}}</textarea>
    </li>
  </ul>
  <div style="color:blue;padding:10px 0 10px 0;cursor:pointer;text-align:center" (click)="teamNumberDisplay=teamNumberDisplay+25;teamAds=db.list('teamAds/',{query:{orderByChild:'memberAdVisible',equalTo:true,limitToFirst:teamNumberDisplay}})">More</div>
  </div>
  `,
})
export class TeamAdsComponent {
  firstName: string;
  lastName: string;
  resume: string;
  photoURL: string;
  editMode: boolean;
  memberStatus: string;
  leaderStatus: boolean;
  ownProfile: boolean;
  teamAds: FirebaseListObservable<any>;
  totalCOIN: number;
  sheetNumber: number;
  teamNumberDisplay: number;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService, public DB: databaseService) {
    this.teamNumberDisplay=25;
    this.sheetNumber=1;
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

  getTeamBalance (ID: string) :string {
    var output;
    this.db.object('PERRINNTeamBalance/' + ID).subscribe(snapshot => {
      output = snapshot.balance;
    });
    return output;
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

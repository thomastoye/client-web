import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'COINinfo',
  template: `
  <div class="sheet">
    <div [class.selected]="sheetNumber===1" style="float:left; cursor:pointer; color:blue; padding:15px;" (click)="sheetNumber=1">COIN info</div>
    <div [class.selected]="sheetNumber===2" style="float:left; cursor:pointer; color:blue; padding:15px;" (click)="sheetNumber=2">COIN ownership</div>
    <div [class.selected]="sheetNumber===3" style="float:left; cursor:pointer; color:blue; padding:15px;" (click)="sheetNumber=3">COIN price</div>
  </div>
  <div class="sheet" [hidden]="sheetNumber!=1">
      <div style="width:33%;max-width:200px;float:left;text-align:center;padding-top:25px">
      <img (error)="errorHandler($event)" src="./../assets/App icons/icon_share_03.svg" style="width:100%;max-width:100px">
      </div>
      <div style="width:66%">
      <div class="title">{{(sheetContent1|async)?.title}}</div>
      <div class="content">{{(sheetContent1|async)?.content1}}</div>
      <div class="content">{{(sheetContent1|async)?.content2}}</div>
      <div class="content">{{(sheetContent1|async)?.content3}}</div>
      </div>
      <div style="height:50px"></div>
      <div style="width:33%;max-width:200px;float:left">
      <img (error)="errorHandler($event)" src="{{(sheetContent2|async)?.image}}" style="width:100%;">
      </div>
      <div style="width:66%">
      <div class="title">{{(sheetContent2|async)?.title}}</div>
      <div class="content">{{(sheetContent2|async)?.content1}}</div>
      <div class="content">{{(sheetContent2|async)?.content2}}</div>
      <div class="content">{{(sheetContent2|async)?.content3}}</div>
      </div>
      <div style="height:50px"></div>
      <div style="width:33%;max-width:200px;float:left">
      <img (error)="errorHandler($event)" src="{{(sheetContent3|async)?.image}}" style="width:100%;">
      </div>
      <div style="width:66%">
      <div class="title">{{(sheetContent3|async)?.title}}</div>
      <div class="content">{{(sheetContent3|async)?.content1}}</div>
      <div class="content">{{(sheetContent3|async)?.content2}}</div>
      <div class="content">{{(sheetContent3|async)?.content3}}</div>
      </div>
  </div>
  <div class="sheet" [hidden]="sheetNumber!=2">
  <div class="title" style="color: black;text-align:left;">There are {{totalCOIN | number:'1.2-2'}} COINS in circulation</div>
  <ul class="listLight">
    <li *ngFor="let team of PERRINNTeamBalance | async"
      [class.selected]="team.$key === UI.currentTeam"
      (click)="router.navigate(['team',team.$key])">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div style="width:15px;height:25px;float:left;">{{DB.getUserLeader(team.$key,UI.currentUser)?"*":""}}</div>
      <div style="width:200px;height:25px;float:left;">{{DB.getTeamName(team.$key)}}</div>
      <div style="width:80px;height:25px;float:left; text-align:right;">{{team.balance | number:'1.2-2'}}</div>
    </li>
  </ul>
  <div style="color:blue;padding:10px 0 10px 0;cursor:pointer;text-align:center" (click)="teamNumberDisplay=teamNumberDisplay+25;PERRINNTeamBalance=db.list('PERRINNTeamBalance/',{query:{orderByChild:'balanceNegative',limitToFirst:teamNumberDisplay}})">More</div>
  </div>
  <div class="sheet" [hidden]="sheetNumber!=3">
  <iframe width='100%' height='3000' src="https://goo.gl/urwsGe"></iframe>
  </div>
  `,
})
export class COINinfoComponent {
  PERRINNTeamBalance: FirebaseListObservable<any>;
  totalCOIN: number;
  sheetNumber: number;
  teamNumberDisplay: number;
  sheetContent1: FirebaseObjectObservable<any>;
  sheetContent2: FirebaseObjectObservable<any>;
  sheetContent3: FirebaseObjectObservable<any>;

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService) {
    this.sheetContent1 = db.object('appSettings/whatIsCOIN');
    this.sheetContent2 = db.object('appSettings/howToUseCOIN');
    this.sheetContent3 = db.object('appSettings/whyBuyCOIN');
    this.teamNumberDisplay=25;
    this.sheetNumber=1;
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

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'team',
  template: `
  <div class='sheet'>
  <div style="z-index:9999;position:fixed;width:100px;font-size:12px;cursor:pointer;color:blue;text-align:center;float:left;background-color:#eff5ff;padding:5px" (click)="router.navigate(['chat',UI.currentTeam])">< Chat</div>
  <div style="float:right;width:100px;text-align:center">
    <div style="z-index:9999;position:fixed;width:100px;font-size:12px;cursor:pointer;color:blue;text-align:center;float:right;background-color:#eff5ff;padding:5px" (click)="router.navigate(['wallet',UI.currentTeam])">Wallet ></div>
  </div>
  <div style="position:relative;margin-bottom:-115px">
  <img class="imageWithZoom" (error)="errorHandler($event)"[src]="DB.getTeamPhotoURL(this.UI.currentTeam)" style="object-fit:cover;background-color:#0e0e0e;max-height:250px; width:100%" (click)="showFullScreenImage(DB.getTeamPhotoURL(this.UI.currentTeam))">
  <div class="sheetBadge" style="position:relative;top:-115px">
  <div style="text-align:center;font-size:18px;line-height:30px;font-family:sans-serif;">{{DB.getTeamName(this.UI.currentTeam)}}</div>
  <div class="buttonDiv" *ngIf="!DB.getUserFollowing(UI.currentUser,UI.currentTeam)" (click)="followTeam(UI.currentTeam, UI.currentUser)">Follow</div>
  <ul class='listLight' style="display:inline-block;float:left">
    <li class='userIcon' *ngFor="let user of teamLeaders | async" (click)="router.navigate(['user',user.$key])">
      <img (error)="errorHandler($event)"[src]="DB.getUserPhotoURL(user.$key)" style="object-fit: cover; height:140px; width:140px">
      <div style="margin:0 0 5px 15px;font-size:12px;line-height:15px;font-family:sans-serif;">{{DB.getUserFirstName(user.$key)}}*</div>
    </li>
  </ul>
  <ul class='listLight' style="display:inline-block">
    <li class='userIcon' *ngFor="let user of teamMembers | async" (click)="router.navigate(['user',user.$key])">
      <img (error)="errorHandler($event)"[src]="DB.getUserPhotoURL(user.$key)" style="object-fit: cover; height:70px; width:70px">
      <div style="margin:0 0 5px 15px;font-size:12px;line-height:15px;font-family:sans-serif;">{{DB.getUserFirstName(user.$key)}}{{DB.getUserFollowing(user.$key,UI.currentTeam)?"":" (NF)"}}</div>
    </li>
  </ul>
  </div>
  </div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">Following</div>
  <ul class='listLight'>
    <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="router.navigate(['project',project.$key])">
      <img (error)="errorHandler($event)"[src]="DB.getProjectPhotoURL(project.$key)" style="object-fit: cover; height:125px; width:125px;position:relative">
      <div style="height:25px;font-size:10px;line-height:10px">{{DB.getProjectName(project.$key)}}{{(DB.getProjectTeamLeader(project.$key,UI.currentTeam)? " **" : "")}}</div>
    </li>
  </ul>
  </div>
`,
})
export class TeamProfileComponent  {

  teamLeaders: FirebaseListObservable<any>;
  teamMembers: FirebaseListObservable<any>;
  teamProjects: FirebaseListObservable<any>;
  newMemberID: string;

  constructor(public db: AngularFireDatabase,public router: Router,public UI: userInterfaceService,public DB: databaseService,private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.teamProjects = this.db.list('teamProjects/'+this.UI.currentTeam, {
        query:{
          orderByChild:'following',
          equalTo: true,
        }
      });
      this.teamLeaders = this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/leaders');
      this.teamMembers = this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/members');
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  followTeam (teamID: string, userID: string) {
    this.db.object('userTeams/'+userID+'/'+teamID).update({
      following:true,
      lastChatVisitTimestamp:firebase.database.ServerValue.TIMESTAMP
    });
    this.router.navigate(['user',this.UI.currentUser]);
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

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
  <img class="imageWithZoom" (error)="errorHandler($event)"[src]="DB.getTeamPhotoOriginal(this.UI.currentTeam)" style="object-fit:cover;max-height:250px; width:100%" (click)="showFullScreenImage(DB.getTeamPhotoOriginal(this.UI.currentTeam))">
  <div class="sheetBadge" style="position:relative;top:-115px">
  <div style="text-align:center;font-size:18px;line-height:30px;font-family:sans-serif;">{{DB.getTeamName(this.UI.currentTeam)}}</div>
  <div class="buttonDiv" *ngIf="!DB.getUserFollowing(UI.currentUser,UI.currentTeam)" (click)="followTeam(UI.currentTeam, UI.currentUser)">Follow</div>
  <div style="width:50%;float:left">
  <ul class='listLight' style="display:inline-block;float:left">
    <li *ngFor="let user of teamLeaders|async;let first=first" (click)="router.navigate(['user',user.$key])">
      <div *ngIf="first" style="color:#333;text-align:center;font-size:11px;padding:5px">Leaders</div>
      <div *ngIf="!first" class="seperator"></div>
      <img (error)="errorHandler($event)"[src]="DB.getUserPhotoThumb(user.$key)" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{DB.getUserFirstName(user.$key)}}</div>
    </li>
  </ul>
  </div>
  <div style="width:50%;float:right">
  <ul class='listLight' style="display:inline-block">
    <li *ngFor="let user of teamMembers|async;let first=first" (click)="router.navigate(['user',user.$key])">
      <div *ngIf="first" style="color:#333;text-align:center;font-size:11px;padding:5px">Members</div>
      <div *ngIf="!first" class="seperator"></div>
      <img (error)="errorHandler($event)"[src]="DB.getUserPhotoThumb(user.$key)" style="float:left;object-fit:cover;height:30px;width:30px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{DB.getUserFirstName(user.$key)}}{{DB.getUserFollowing(user.$key,UI.currentTeam)?"":" (NF)"}}</div>
    </li>
  </ul>
  </div>
  </div>
  </div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">Following</div>
  <ul class='listLight'>
    <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="router.navigate(['project',project.$key])">
      <img (error)="errorHandler($event)"[src]="DB.getProjectPhotoThumb(project.$key)" style="object-fit: cover; height:125px; width:125px;position:relative">
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
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
  }

}

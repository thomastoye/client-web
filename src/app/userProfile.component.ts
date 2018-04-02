import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'user',
  template: `
  <div class="sheet">
  <div style="float:left;width:80%">
  <div class='title' style="float:left;font-size:16px">{{UI.focusUser==UI.currentUser?UI.currentUserFirstName:DB.getUserFirstName(UI.focusUser)}} {{UI.focusUser==UI.currentUser?UI.currentUserLastName:DB.getUserLastName(UI.focusUser)}}</div>
  <img class='editButton' style="width:20px" [hidden]='!(UI.currentUser==UI.focusUser)' (click)="this.router.navigate(['userSettings',UI.focusUser])" src="./../assets/App icons/settings.png">
  <div style="color:#888;font-size:11px;padding:0 5px 5px 10px;clear:both">Joined {{DB.getUserCreatedTimestamp(UI.focusUser)|date:'MMMM yyyy'}}, {{DB.getUserMessageCount(UI.focusUser)==null?0:DB.getUserMessageCount(UI.focusUser)}} Messages</div>
  </div>
  <div style="float:right;width:20%;position:relative">
  <img (error)="errorHandler($event)" class="imageWithZoom" [src]="UI.focusUser==UI.currentUser?UI.currentUserImageUrlThumb:DB.getUserImageUrlThumb(UI.focusUser)" style="float:right;object-fit:cover;height:60px;width:60px" (click)="showFullScreenImage(DB.getUserImageUrlOriginal(UI.focusUser))">
  </div>
  </div>
  <div class='sheet' style="margin-top:5px">
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
      (click)="router.navigate(['chat',team.$key])">
      <div *ngIf="DB.getUserFollowing(UI.focusUser,team.$key)">
      <div style="float:left">
        <img (error)="errorHandler($event)" [src]="DB.getTeamImageUrlThumb(team.$key)" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:55px;width:100px;border-radius:3px">
      </div>
      <div>
        <div *ngIf="DB.getUserPersonalTeam(UI.focusUser)==team.$key" style="float:left;margin:15px 5px 0 0;color:green;font-size:11px;background-color:#eee;width:55px;text-align:center">Personal</div>
        <img [hidden]="!(DB.getTeamBalance(team.$key)>0)" src="./../assets/App icons/icon_share_03.svg" style="float:left;height:17px;margin:5px;margin-top:17px">
        <div style="float:left;margin-top:15px;color:#222;white-space:nowrap;width:30%;text-overflow:ellipsis">{{DB.getTeamName(team.$key)}}{{(DB.getTeamLeader(team.$key,UI.focusUser)?" *":"")}}</div>
        <div style="float:left;margin:5px;margin-top:19px;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="DB.getTeamLastMessageTimestamp(team.$key)>team.lastChatVisitTimestamp"></div>
        <div style="float:right;margin-top:10px;color:#999;margin-right:10px">{{team.lastChatVisitTimestamp|date:'d MMM'}}</div>
        <div *ngIf="DB.getTeamLastMessageText(team.$key)" style="clear:both;white-space:nowrap;width:60%;text-overflow:ellipsis;color:#888">{{DB.getUserFirstName(DB.getTeamLastMessageUser(team.$key))}}: {{DB.getTeamLastMessageText(team.$key)}}</div>
      </div>
      <div class="seperator"></div>
      </div>
    </li>
  </ul>
  </div>
  `,
})
export class UserProfileComponent {
  userTeams: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.focusUser = params['id'];
      this.UI.currentTeam=this.DB.getUserPersonalTeam(this.UI.focusUser);
      this.userTeams=db.list('userTeams/'+this.UI.focusUser, {
        query:{
          orderByChild:'lastChatVisitTimestampNegative',
        }
      });
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  errorHandler(event) {
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
  }

}

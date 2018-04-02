import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'search',
  template: `
  <div class="sheet">
  <div style="z-index:9999;position:fixed;width:100px;font-size:12px;cursor:pointer;color:blue;text-align:center;float:left;background-color:#eff5ff;padding:5px" (click)="router.navigate(['chat',UI.currentTeam])">< Chat</div>
  <div style="float:right;width:100px;text-align:center">
    <div style="z-index:9999;position:fixed;width:100px;font-size:12px;cursor:pointer;color:blue;text-align:center;float:right;background-color:#eff5ff;padding:5px" (click)="router.navigate(['wallet',UI.currentTeam])">Wallet ></div>
  </div>
  <input id="searchInput" maxlength="500" style="margin-top:40px" (keyup)="refreshSearchLists()" [(ngModel)]="searchFilter" placeholder="Search">
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Users</div>
  <ul class="listLight">
    <li *ngFor="let user of users | async"
      (click)="router.navigate(['user',user.$key])">
      <img (error)="errorHandler($event)"[src]="DB.getUserImageUrlThumb(user.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div>{{user.firstName}} {{user.lastName}}</div>
      <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="addMessage(user.$key,'','',user.$key)">Send to chat</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Teams</div>
  <ul class="listLight">
    <li *ngFor="let team of teams | async"
      (click)="router.navigate(['chat',team.$key]);">
      <img (error)="errorHandler($event)"[src]="team?.imageUrlThumb" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div>{{team.name}}</div>
      <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="addMessage(team.$key,'',team.$key,'')">Send to chat</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Projects</div>
  <ul class="listLight">
    <li *ngFor="let project of projects | async"
      (click)="router.navigate(['project',project.$key])">
      <img (error)="errorHandler($event)"[src]="DB.getProjectImageUrlThumb(project.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{project.name}}
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Image library</div>
  <ul class="listLight">
    <li *ngFor="let image of images | async"
    [class.selected]="image.$key === selectedImageID"
    (click)="selectedImageID=image.$key"
    style="text-align:center;padding:10px;float:left">
      <img [src]="DB.getImageUrlThumb(image.image)" style="display: inline;opacity: 1;object-fit:cover;height:100px;width:140px;border-radius:3px">
      <div style="line-height:normal">{{image.name}}</div>
      <div style="height:30px">
      <div class="buttonDiv" *ngIf="image.$key===selectedImageID" (click)="addMessage(image.image,image.image,'','')">Send to chat</div>
      </div>
    </li>
  </ul>
  </div>
  `,
})

export class SearchComponent  {

  users: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  projects: FirebaseListObservable<any>;
  images: FirebaseListObservable<any>;
  searchFilter: string;

  constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService) {
    this.images = this.db.list('appSettings/photoLibrary', {
      query:{
        orderByChild:'name',
      }
    });
  }

  ngOnInit () {
    document.getElementById("searchInput").focus();
    this.refreshSearchLists();
  }

  refreshSearchLists () {
    if (this.searchFilter) {
      if (this.searchFilter.length>1) {
        this.users = this.db.list('PERRINNUsers/', {
          query:{
            orderByChild:'firstName',
            startAt: this.searchFilter.toLowerCase(),
            endAt: this.searchFilter.toLowerCase()+"\uf8ff",
            limitToFirst: 10
          }
        });
        this.teams = this.db.list('PERRINNTeams/', {
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
    }
    else {
      this.users = null;
      this.teams = null;
      this.projects = null;
    }
  }

  addMessage(text,image,linkTeam,linkUser) {
    this.UI.processNewMessage(text).then(isProcessReady=>{
      firebase.database().ref('teamServices/'+this.UI.currentTeam+'/process').once('value',process=>{
        var processData=isProcessReady?process.val():null;
        const now = Date.now();
        var messageID=firebase.database().ref('teamMessages/'+this.UI.currentTeam).push({
          timestamp:now,
          text:text,
          image:image,
          user:this.UI.currentUser,
          firstName:this.UI.currentUserFirstName,
          imageUrlThumbUser:this.UI.currentUserImageUrlThumb,
          linkTeam:linkTeam,
          linkTeamName:linkTeam?this.DB.getTeamName(linkTeam):null,
          linkTeamImageUrlThumb:this.DB.getTeamImageUrlThumb(linkTeam)!=undefined?this.DB.getTeamImageUrlThumb(linkTeam):null,
          linkUser:linkUser,
          linkUserFirstName:linkUser?this.DB.getUserFirstName(linkUser):null,
          linkUserLastName:linkUser?this.DB.getUserLastName(linkUser):null,
          linkUserImageUrlThumb:this.DB.getUserImageUrlThumb(linkUser)!=undefined?this.DB.getUserImageUrlThumb(linkUser):null,
          process:processData,
        }).key;
        if (isProcessReady) {
          this.db.object('teamServices/'+this.UI.currentTeam+'/process').update({
            messageID:messageID,
          });
        }
        this.db.object('teamActivities/'+this.UI.currentTeam).update({
          lastMessageTimestamp:now,
          lastMessageText:text,
          lastMessageUser:this.UI.currentUser,
        });
        this.db.object('userTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).update({
          lastChatVisitTimestamp:now,
          lastChatVisitTimestampNegative:-1*now,
        });
        this.router.navigate(['chat',this.UI.currentTeam])
      });
    });
  }

  errorHandler(event) {
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
  }

}

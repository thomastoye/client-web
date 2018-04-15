import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'user',
  template: `
  <div class="sheet">
  <div style="float:left;width:80%">
  <div class='title' style="float:left;font-size:16px">{{UI.focusUserObj?.firstName}} {{UI.focusUserObj?.lastName}}</div>
  <img class='editButton' style="width:20px" [hidden]='!(UI.currentUser==UI.focusUser)' (click)="this.router.navigate(['userSettings',UI.focusUser])" src="./../assets/App icons/settings.png">
  <div style="color:#888;font-size:11px;padding:0 5px 5px 10px;clear:both">Joined {{UI.focusUserObj?.createdTimestamp|date:'MMMM yyyy'}}, {{UI.focusUserObj?.messageCount?UI.focusUserObj?.messageCount:0}} Messages</div>
  </div>
  <div style="float:right;width:20%;position:relative">
  <img class="imageWithZoom" [src]="UI.focusUserObj?.imageUrlThumb" style="float:right;object-fit:cover;height:60px;width:60px" (click)="showFullScreenImage(UI.focusUserObj?.imageUrlOriginal)">
  </div>
  </div>
  <div class='sheet' style="margin-top:5px">
  <ul class="listLight">
    <li *ngFor="let team of viewUserTeams|async;let last=last"
      (click)="router.navigate(['chat',team.$key])">
      <div style="float:left">
        <img [src]="team?.imageUrlThumb" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:55px;width:100px;border-radius:3px">
      </div>
      <div>
        <div *ngIf="UI.focusUserObj?.personalTeam==team.$key" style="float:left;margin:15px 5px 0 0;color:green;font-size:11px;background-color:#eee;width:55px;text-align:center">Personal</div>
        <img [hidden]="!(team.balance>0)" src="./../assets/App icons/icon_share_03.svg" style="float:left;height:17px;margin:5px;margin-top:17px">
        <div style="float:left;margin-top:15px;color:#222;white-space:nowrap;width:30%;text-overflow:ellipsis">{{team.name}}</div>
        <div style="float:left;margin:5px;margin-top:19px;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="team.lastMessageTimestamp>team.lastChatVisitTimestamp"></div>
        <div *ngIf="(now-team.lastMessageTimestamp)>43200000" style="float:right;margin-top:10px;color:#999;font-size:11px;margin-right:10px">{{team.lastMessageTimestamp|date:'d MMM yyyy'}}</div>
        <div *ngIf="(now-team.lastMessageTimestamp)<=43200000" style="float:right;margin-top:10px;color:#999;font-size:11px;margin-right:10px">{{team.lastMessageTimestamp|date:'HH:mm'}}</div>
        <div style="clear:both;white-space:nowrap;width:60%;text-overflow:ellipsis;color:#888">{{team?.lastMessageFirstName}}: {{team?.lastMessageText}}</div>
      </div>
      <div class="seperator"></div>
      {{last?scrollToTop(team.key):''}}
    </li>
  </ul>
  </div>
  `,
})
export class UserProfileComponent {
  viewUserTeams:FirebaseListObservable<any>;
  now:number;
  scrollTeam:string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, private route: ActivatedRoute) {
    this.UI.currentTeam="";
    this.now = Date.now();
    this.scrollTeam='';
    this.route.params.subscribe(params => {
      this.UI.focusUser = params['id'];
      db.object('PERRINNUsers/'+this.UI.focusUser).subscribe(snapshot=>{
        this.UI.focusUserObj=snapshot;
      });
      this.viewUserTeams=db.list('viewUserTeams/'+this.UI.focusUser, {
        query:{
          orderByChild:'lastMessageTimestampNegative',
        }
      });
    });
  }

  scrollToTop(team:string) {
    if (team!=this.scrollTeam) {
      var element=document.getElementById("main_container");
      element.scrollTop=0;
      this.scrollTeam=team;
    }
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

}

import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'user',
  template: `
  <div id='main_container'>
  <div style="max-width:800px;margin:0 auto">
    <img class='editButton' style="float:right;width:25px" [hidden]='!(UI.currentUser==UI.focusUser)' (click)="this.router.navigate(['userSettings',UI.focusUser])" src="./../assets/App icons/settings.png">
    <div style="float:right;width:70px;height:24px;text-align:center;line-height:20px;font-size:20px;margin:5px;color:white;background-color:#267cb5;border-radius:5px;cursor:pointer">+</div>
  </div>
  <div class='sheet'>
  <div class="spinner" *ngIf="UI.loading">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
  <ul class="listLight" style="background-color:#f4f7fc">
    <li *ngFor="let team of viewTeams|async;let last=last"
      (click)="router.navigate(['chat',team.key])">
      <div *ngIf="team.key==UI.focusUser">
        <div style="float:left">
          <img [src]="UI.focusUserObj?.imageUrlThumb" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:75px;width:75px;border-radius:50px">
        </div>
        <div>
          <div style="float:left;margin-top:5px">
            <span style="color:#222;font-size:16px" *ngFor="let leader of objectToArray(team.values?.leaders);let last=last">{{leader[1]?.name}}{{last?"":", "}}</span>
          </div>
          <div *ngIf="(now-team.values?.lastMessageTimestamp)>43200000" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px">{{team.values?.lastMessageTimestamp|date:'d MMM yyyy'}}</div>
          <div *ngIf="(now-team.values?.lastMessageTimestamp)<=43200000" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px">{{team.values?.lastMessageTimestamp|date:'HH:mm'}}</div>
          <div style="clear:both;float:left;color:#222;white-space:nowrap;width:75%;text-overflow:ellipsis">
            <span >{{team.values?.name}}</span>
            <span style="font-size:10px"> {{team.values?.familyName}}</span>
          </div>
          <div style="float:right;margin:5px;margin:9px 15px 0 0;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="isActivity(team.values?.lastMessageTimestamp,team.values?.lastChatVisitTimestamp)"></div>
          <div style="clear:both">
            <span style="color:#999" *ngFor="let member of objectToArray(team.values?.members);let last=last">{{member[1]?.name}}{{last?"":", "}}</span>
          </div>
          <div style="clear:both;white-space:nowrap;width:60%;text-overflow:ellipsis;color:#888">{{team.values?.lastMessageName}}: {{team.values?.lastMessageText}}</div>
          <div style="clear:both;float:left;font-size:10px;color:#999">Joined {{UI.focusUserObj?.createdTimestamp|date:'MMMM yyyy'}}, {{UI.focusUserObj?.messageCount?UI.focusUserObj?.messageCount:0}} Messages, C{{team.values?.lastMessageBalance?team.values?.lastMessageBalance:0|number:'1.2-2'}}</div>
        </div>
        <div class="seperator" style="margin-left:100px"></div>
      </div>
    </li>
  </ul>
  <ul class="listLight">
    <li *ngFor="let team of viewTeams|async;let last=last"
      (click)="router.navigate(['chat',team.key])">
      <div *ngIf="team.key!=UI.focusUser">
        <div style="float:left">
          <img [src]="team.values?.imageUrlThumb" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:100px;width:75px;border-radius:3px">
        </div>
        <div>
          <div style="float:left;margin-top:5px">
            <span style="color:#222;font-size:16px" *ngFor="let leader of objectToArray(team.values?.leaders);let last=last">{{leader[1]?.name}}{{last?"":", "}}</span>
          </div>
          <div *ngIf="(now-team.values?.lastMessageTimestamp)>43200000" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px">{{team.values?.lastMessageTimestamp|date:'d MMM yyyy'}}</div>
          <div *ngIf="(now-team.values?.lastMessageTimestamp)<=43200000" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px">{{team.values?.lastMessageTimestamp|date:'HH:mm'}}</div>
          <div style="clear:both;float:left;color:#222;white-space:nowrap;width:75%;text-overflow:ellipsis">
            <span >{{team.values?.name}}</span>
            <span style="font-size:10px"> {{team.values?.familyName}}</span>
          </div>
          <div style="float:right;margin:5px;margin:9px 15px 0 0;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="isActivity(team.values?.lastMessageTimestamp,team.values?.lastChatVisitTimestamp)"></div>
          <div style="clear:both">
            <span style="color:#999" *ngFor="let member of objectToArray(team.values?.members);let last=last">{{member[1]?.name}}{{last?"":", "}}</span>
          </div>
          <div style="clear:both;white-space:nowrap;width:60%;text-overflow:ellipsis;color:#888">{{team.values?.lastMessageName}}: {{team.values?.lastMessageText}}</div>
          <div style="clear:both;float:left;font-size:10px;width:100px" [style.color]="team.values?.lastMessageBalance<0?'red':'#999'">C{{team.values?.lastMessageBalance?team.values?.lastMessageBalance:0|number:'1.2-2'}}</div>
        </div>
        <div class="seperator" style="margin-left:100px"></div>
      </div>
      {{last?scrollToTop(team.key):''}}
    </li>
  </ul>
  </div>
  </div>
  `,
})
export class UserProfileComponent {
  viewTeams: Observable<any[]>;
  now: number;
  scrollTeam: string;

  constructor(public db: AngularFireDatabase, public afs: AngularFirestore, public router: Router, public UI: userInterfaceService, private route: ActivatedRoute) {
    this.UI.loading = true;
    this.UI.currentTeam = '';
    this.now = Date.now();
    this.scrollTeam = '';
    this.route.params.subscribe(params => {
      this.UI.focusUser = params.id;
      afs.doc<any>('PERRINNTeams/'+this.UI.focusUser).valueChanges().subscribe(snapshot=>{
        this.UI.focusUserObj=snapshot;
      });
      this.viewTeams=afs.collection('PERRINNTeams').doc(this.UI.focusUser).collection('viewTeams',ref=>ref.orderBy('lastMessageTimestamp','desc')).snapshotChanges().pipe(
        map(actions=>actions.map(a=>{
          const values=a.payload.doc.data();
          const key=a.payload.doc.id;
          this.UI.loading = false;
          return {key,values};
        }))
      );
    });
  }

  scrollToTop(team: string) {
    if (team != this.scrollTeam) {
      const element = document.getElementById('main_container');
      element.scrollTop = 0;
      this.scrollTeam = team;
    }
  }

  showFullScreenImage(src) {
    const fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.src = src;
    fullScreenImage.style.visibility = 'visible';
  }

  isActivity(lastMessageTimestamp,lastChatVisitTimestamp){
    if(lastMessageTimestamp==undefined)return false;
    else if(lastChatVisitTimestamp==undefined)return true;
    else return lastMessageTimestamp>lastChatVisitTimestamp;
  }

  objectToArray(obj) {
    if (obj == null) { return null; }
    return Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
  }

}

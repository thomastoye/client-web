import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { firebase } from '@firebase/app';
import { Observable } from 'rxjs/Observable';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'team',
  template: `
  <div id='main_container'>
  <div style="max-width:800px;margin:0 auto">
  <div style="position:relative;margin-bottom:-25px">
  <img class="imageWithZoom" [src]="UI.currentTeamObj?.imageUrlMedium?UI.currentTeamObj?.imageUrlMedium:UI.currentTeamObj?.imageUrlThumb" style="object-fit:cover;max-height:250px; width:100%" (click)="showFullScreenImage(UI.currentTeamObj?.imageUrlOriginal)">
  <div class="sheetBadge" style="position:relative;top:-25px">
  <div style="text-align:center;font-size:18px;line-height:30px;font-family:sans-serif;">{{UI.currentTeamObj?.name}}</div>
  <div *ngIf="!isCurrentUserFollowing(UI.currentTeam)" class="buttonDiv" (click)="followTeam(UI.currentTeam, UI.currentUser)">Follow</div>
  <div *ngIf="isCurrentUserFollowing(UI.currentTeam)" class="buttonDiv" style="color:green;cursor:default">Following</div>
  <div style="width:50%;float:left">
  <ul class='listLight' style="display:inline-block;float:left">
    <li *ngFor="let user of teamLeaders|async;let first=first" (click)="router.navigate(['user',user.key])">
      <div *ngIf="first" style="color:#333;text-align:center;font-size:11px;padding:5px">Leaders</div>
      <div *ngIf="!first" class="seperator"></div>
      <img [src]="user?.imageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{(user?.firstName|async)}}</div>
    </li>
  </ul>
  </div>
  <div style="width:50%;float:right">
  <ul class='listLight' style="display:inline-block">
    <li *ngFor="let user of teamMembers|async;let first=first" (click)="router.navigate(['user',user.key])">
      <div *ngIf="first" style="color:#333;text-align:center;font-size:11px;padding:5px">Members</div>
      <div *ngIf="!first" class="seperator"></div>
      <img [src]="user?.imageUrlThumb|async" style="float:left;object-fit:cover;height:30px;width:30px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{user?.firstName|async}}</div>
    </li>
  </ul>
  </div>
  </div>
  </div>
  </div>
  </div>
`,
})
export class TeamProfileComponent  {

  teamLeaders: Observable<any[]>;
  teamMembers: Observable<any[]>;

  constructor(public db: AngularFireDatabase,public router:Router,public UI:userInterfaceService,private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.teamLeaders=this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/leaders').snapshotChanges().map(changes=>{
        return changes.map(c=>({
          key:c.payload.key,
          values:c.payload.val(),
          firstName:this.db.object('PERRINNUsers/'+c.payload.key+'/firstName').valueChanges(),
          imageUrlThumb:this.db.object('PERRINNUsers/'+c.payload.key+'/imageUrlThumb').valueChanges(),
        }));
      });
      this.teamMembers=this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/members').snapshotChanges().map(changes=>{
        return changes.map(c=>({
          key:c.payload.key,
          values:c.payload.val(),
          firstName:this.db.object('PERRINNUsers/'+c.payload.key+'/firstName').valueChanges(),
          imageUrlThumb:this.db.object('PERRINNUsers/'+c.payload.key+'/imageUrlThumb').valueChanges(),
        }));
      });
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  followTeam (teamID: string, userID: string) {
    const now = Date.now();
    this.db.object('viewUserTeams/'+userID+'/'+teamID).update({
      lastChatVisitTimestamp:now,
      lastChatVisitTimestampNegative:-1*now,
      name:this.UI.currentTeamObj.name,
      imageUrlThumb:this.UI.currentTeamObj.imageUrlThumb?this.UI.currentTeamObj.imageUrlThumb:'',
    });
    this.db.object('subscribeTeamUsers/'+teamID).update({
      [userID]:true,
    });
    this.router.navigate(['user',this.UI.currentUser]);
  }

  isCurrentUserFollowing(team){
    if(this.UI.currentUserTeamsObj==undefined)return false;
    if(this.UI.currentUserTeamsObj[team]==undefined)return false;
    return true;
  }

}

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
  <img class="imageWithZoom" [src]="UI.currentTeamObj?.imageUrlMedium?UI.currentTeamObj?.imageUrlMedium:UI.currentTeamObj?.imageUrlThumb" style="object-fit:cover;max-height:150px;width:100%" (click)="showFullScreenImage(UI.currentTeamObj?.imageUrlOriginal)">
  <div style="text-align:center;font-size:18px;line-height:30px;font-family:sans-serif;">{{UI.currentTeamObj?.name}}</div>
  <div *ngIf="!isCurrentUserFollowing(UI.currentTeam)" class="buttonDiv" (click)="followTeam(UI.currentTeam, UI.currentUser)">Follow</div>
  <div *ngIf="isCurrentUserFollowing(UI.currentTeam)" class="buttonDiv" style="color:green;cursor:default">Following</div>
  <div class='sheet' style="margin-top:5px">
  <div class="title">Leaders</div>
  <ul class='listLight' style="display:inline-block;float:left">
    <li *ngFor="let user of teamLeaders|async" (click)="router.navigate(['user',user.key])">
      <img [src]="user?.imageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{(user?.firstName|async)}}</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:5px">
  <div class="title">Members</div>
  <ul class='listLight' style="display:inline-block">
    <li *ngFor="let user of teamMembers|async" (click)="router.navigate(['user',user.key])">
      <img [src]="user?.imageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:50px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{user?.firstName|async}}</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:5px">
  <div class="title">Parent</div>
    <div *ngIf="parent!=undefined" style="cursor:pointer" (click)="router.navigate(['chat',parent])">
      <img [src]="parentImageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:75px;border-radius:3px;margin:5px 5px 5px 10px">
      <div style="float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{parentName|async}}</div>
    </div>
    <div *ngIf="parent==undefined" style="margin-left:20px;color:#777;font-size:10px">{{UI.currentTeamObj?.name}} has no parent team</div>
  </div>
  <div class='sheet' style="margin-top:5px">
  <div class="title">Children</div>
    <ul class='listLight' style="display:inline-block">
      <li *ngFor="let team of teamChildren|async" (click)="router.navigate(['chat',team.key])">
        <img [src]="team?.imageUrlThumb|async" style="float:left;object-fit:cover;height:50px;width:75px;border-radius:3px;margin:5px 5px 5px 10px">
        <div style="float:left;margin:10px 5px 5px 5px;font-size:12px;line-height:15px;font-family:sans-serif">{{team?.name|async}}</div>
      </li>
    </ul>
  </div>
  </div>
  </div>
`,
})
export class TeamProfileComponent  {

  teamLeaders:Observable<any[]>;
  teamMembers:Observable<any[]>;
  teamChildren:Observable<any[]>;
  parent:string;
  parentName:Observable<{}>;
  parentImageUrlThumb:Observable<{}>;

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
      this.db.object('PERRINNTeams/'+this.UI.currentTeam+'/parent').snapshotChanges().subscribe(changes=>{
        this.parent=changes.payload.val();
        this.parentName=this.db.object('PERRINNTeams/'+this.parent+'/name').valueChanges();
        this.parentImageUrlThumb=this.db.object('PERRINNTeams/'+this.parent+'/imageUrlThumb').valueChanges();
      });
      this.teamChildren=this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/children').snapshotChanges().map(changes=>{
        return changes.map(c=>({
          key:c.payload.key,
          values:c.payload.val(),
          name:this.db.object('PERRINNTeams/'+c.payload.key+'/name').valueChanges(),
          imageUrlThumb:this.db.object('PERRINNTeams/'+c.payload.key+'/imageUrlThumb').valueChanges(),
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

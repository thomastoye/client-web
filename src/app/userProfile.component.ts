import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import { firebase } from '@firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'user',
  template: `
  <div id='main_container'>
  <div style="max-width:800px;margin:0 auto">
  <div style="float:left;width:80%">
  <div class='title' style="float:left;font-size:16px">{{UI.focusUserObj?.firstName}} {{UI.focusUserObj?.lastName}}</div>
  <img class='editButton' style="width:20px" [hidden]='!(UI.currentUser==UI.focusUser)' (click)="this.router.navigate(['userSettings',UI.focusUser])" src="./../assets/App icons/settings.png">
  <div style="color:#888;font-size:11px;padding:0 5px 5px 10px;clear:both">Joined {{UI.focusUserObj?.createdTimestamp|date:'MMMM yyyy'}}, {{UI.focusUserObj?.messageCount?UI.focusUserObj?.messageCount:0}} Messages</div>
  </div>
  <div style="float:right;width:20%;position:relative">
  <img class="imageWithZoom" [src]="UI.focusUserObj?.imageUrlThumb" style="float:right;object-fit:cover;height:60px;width:60px" (click)="showFullScreenImage(UI.focusUserObj?.imageUrlOriginal)">
  </div>
  <ul class="listProject" style="clear:both">
    <li class="project" *ngFor="let project of projects"
    [class.selected]="project==UI.selectedProject"
    (click)="UI.selectedProject=project">
      <div style="line-height:40px;font-size:11px" [style.color]="UI.projectActivity==undefined?'':(UI.projectActivity[project]?'red':'')">{{project}}</div>
    </li>
  </ul>
  </div>
  <div class='sheet'>
  <div class="spinner" *ngIf="UI.loading">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
  <ul class="listLight">
    <li *ngFor="let team of viewUserTeams|async;let last=last"
      (click)="router.navigate(['chat',team.key])">
      <div *ngIf="team.values?.projectName==UI.selectedProject||team.values?.projectName==undefined&&UI.selectedProject==UI.noProject">
      <div style="float:left">
        <img [src]="team.values?.imageUrlThumb" style="display:inline;float:left;margin: 7px 10px 7px 10px;object-fit:cover;height:60px;width:100px;border-radius:3px">
      </div>
      <div>
        <div style="float:left;margin-top:5px;color:#222;white-space:nowrap;width:30%;text-overflow:ellipsis">{{team.values.name}}</div>
        <div style="float:left;margin:5px;margin-top:9px;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="team.values.lastMessageTimestamp>team.values.lastChatVisitTimestamp"></div>
        <div *ngIf="(now-team.values.lastMessageTimestamp)>43200000" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px">{{team.values.lastMessageTimestamp|date:'d MMM yyyy'}}</div>
        <div *ngIf="(now-team.values.lastMessageTimestamp)<=43200000" style="float:right;margin-top:5px;color:#999;font-size:11px;margin-right:10px">{{team.values.lastMessageTimestamp|date:'HH:mm'}}</div>
        <div style="clear:both;white-space:nowrap;width:60%;text-overflow:ellipsis;color:#888">{{team.values?.lastMessageFirstName}}: {{team.values?.lastMessageText}}</div>
        <div *ngIf="team.values?.lastMessageBalance!=undefined" style="clear:both;float:left;font-size:10px;color:#999;width:100px">C{{team.values?.lastMessageBalance|number:'1.2-2'}}</div>
        <div *ngIf="team.values?.chatReplayMode" style="float:left;color:green;font-size:10px">chat replay</div>
      </div>
      <div class="seperator" style="margin-left:120px"></div>
      {{last?scrollToTop(team.key):''}}
      </div>
    </li>
  </ul>
  </div>
  </div>
  `,
})
export class UserProfileComponent {
  projects:any;
  viewUserTeams:Observable<any[]>;
  now:number;
  scrollTeam:string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, private route: ActivatedRoute) {
    this.UI.loading=true;
    this.UI.currentTeam="";
    this.now = Date.now();
    this.scrollTeam='';
    this.projects=[this.UI.noProject];
    if(this.UI.selectedProject==undefined)this.UI.selectedProject=this.UI.noProject;
    this.route.params.subscribe(params => {
      this.UI.focusUser = params['id'];
      db.object('PERRINNUsers/'+this.UI.focusUser).valueChanges().subscribe(snapshot=>{
        this.UI.focusUserObj=snapshot;
      });
      this.viewUserTeams=db.list('viewUserTeams/'+this.UI.focusUser,ref=>ref.orderByChild('lastMessageTimestampNegative')).snapshotChanges().map(changes=>{
        changes.forEach(c=>{
          var project;
          if(c.payload.val().projectName!=undefined){
            project=c.payload.val().projectName;
          } else {
            project=this.UI.noProject;
          }
          if(!this.projects.includes(project)){
            this.projects.push(project);
          }
        });
        this.UI.loading=false;
        return changes.map(c=>({
          key:c.payload.key,
          values:c.payload.val(),
        }));
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

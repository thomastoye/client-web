import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'links',
  template: `
  <div class="sheet">
  <span class="title">Links</span>
  <span class="buttonDiv" *ngIf='currentUserIsMember' style="border-style:none" (click)="editMode=!editMode">{{editMode?"Done":"Edit"}}</span>
  <div class="buttonDiv" *ngIf="currentUserIsMember" style="float:right;margin:10px" (click)="newLink()">New link</div>
  <div style="clear:both;text-align:center;font-size:18px;font-family:sans-serif;">{{teamName}}</div>
  </div>
  <div class="sheet" style="margin-top:5px;background-color: #f9f9f9;box-shadow:none">
  <ul style="clear:both">
    <li style="float:left" *ngFor="let link of teamLinks | async;let i = index">
      <div class="sheet" style="position:relative;margin:10px;width:175px;height:80px">
        <input type="text" class="inputTitle" maxlength="25" (readonly)="currentUserIsMember" #elementTitle (focusout)="db.object('teamLinks/'+UI.currentTeam+'/'+link.$key).update({title:elementTitle.value})" [value]="link.title">
        <input type="text" class="inputLink" maxlength="500" (readonly)="currentUserIsMember" #elementURL (focusout)="db.object('teamLinks/'+UI.currentTeam+'/'+link.$key).update({url:elementURL.value})" [value]="link.url">
        <a [attr.href]="link.url" target="_blank"><img src="./../assets/App icons/infinite-outline.png" style="width:100%;height:35px;object-fit:contain"></a>
        <div style="position:absolute;bottom:0px;left:5px;font-size:10px;color:red;cursor:pointer" *ngIf="editMode" (click)="db.object('teamLinks/'+UI.currentTeam+'/'+link.$key).remove()">Remove</div>
        <div style="position:absolute;bottom:0px;right:5px;font-size:8px">{{i+1}}</div>
      </div>
    </li>
  </ul>
  </div>
  `,
})

export class LinksComponent  {

  teamName: string;
  teamLinks: FirebaseListObservable<any>;
  currentUserIsMember: boolean;
  editMode: boolean;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.editMode = false;
      this.currentUserIsMember=false;
      this.db.object('teams/'+this.UI.currentTeam).subscribe (team=>{
        this.teamName = team.name;
      });
      this.db.object('teamUsers/'+this.UI.currentTeam+'/'+this.UI.currentUser).subscribe(teamUser=>{
        if (teamUser!=null && teamUser.member) {this.currentUserIsMember=true}
      });
      this.teamLinks = db.list('teamLinks/'+this.UI.currentTeam);
    });
  }

  newLink () {
    this.db.list('teamLinks/'+this.UI.currentTeam).push({title:"Title",url:"link"});
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

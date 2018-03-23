import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'teamSettings',
  template: `
  <div class="sheet" style="background-color:#f5f5f5">
  <div class="title">Leaders</div>
  <div style="font-size:10px;padding:10px;color:#888">(Maximum 2 leaders per team)</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let user of teamLeaders | async; let i = index">
      <div style="float:left;padding:10px;font-size:11px">{{i+1}})</div>
      <div style="width:200px;float:left">
      <img (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(user.$key)" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:30px;width:30px;border-radius:3px">
      <div style="float:left;margin-top:10px;color:#222">{{DB.getUserFirstName(user.$key)}} {{DB.getUserLastName(user.$key)}}</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  <div class="title">Members</div>
  <div style="font-size:10px;padding:10px;color:#888">(Maximum 6 members per team)</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let user of teamMembers | async; let i = index">
      <div style="float:left;padding:10px;font-size:11px">{{i+1}})</div>
      <div style="width:200px;float:left">
      <img (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(user.$key)" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:30px;width:30px;border-radius:3px">
      <div style="float:left;margin-top:10px;color:#222">{{DB.getUserFirstName(user.$key)}} {{DB.getUserLastName(user.$key)}}</div>
      </div>
      <div style="width:100px;float:left">
      <div *ngIf="DB.getTeamLeader(UI.currentTeam,UI.currentUser)" class="buttonDiv" style="font-size:11px;color:red" (click)="db.list('teams/'+UI.currentTeam).push({removeMember:user.$key})">Remove from team</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  </div>
  `,
})
export class TeamSettingsComponent {
  teamLeaders: FirebaseListObservable<any>;
  teamMembers: FirebaseListObservable<any>;
  teamProjects: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam = params['id'];
      this.teamLeaders = this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/leaders');
      this.teamMembers = this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/members');
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

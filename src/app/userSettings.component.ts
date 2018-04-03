import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'userSettings',
  template: `
  <div class="sheet" style="background-color:#f5f5f5">
  <div class="buttonDiv" style="color:red" (click)="this.logout();router.navigate(['login']);">logout</div>
  <div class="title">Teams</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === UI.currentTeam">
      <div style="width:200px;float:left">
      <img (error)="errorHandler($event)" [src]="team.imageUrlThumb" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:20px;width:30px;border-radius:3px">
      <div style="width:150px;float:left;margin-top:10px;color:#222;font-size:11px">{{team.name}}{{(DB.getTeamLeader(team.$key,UI.focusUser)?" *":"")}}</div>
      </div>
      <div style="width:100px;height:30px;float:left">
      <div *ngIf="!DB.getTeamLeader(team.$key,UI.focusUser)" class="buttonDiv" style="font-size:11px;color:red" (click)="db.object('userTeams/'+UI.currentUser+'/'+team.$key).remove()">Stop following</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  </div>
  `,
})
export class UserSettingsComponent {
  userTeams: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.focusUser = params['id'];
      this.UI.currentTeam="";
      this.userTeams=db.list('userTeams/'+this.UI.focusUser, {
        query:{
          orderByChild:'lastChatVisitTimestampNegative',
        }
      });
    });
  }

  logout() {
    this.afAuth.auth.signOut()
  }

  errorHandler(event) {
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
  }

}

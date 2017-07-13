import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'app-root',
  template: `
  <div id='main_container'>
    <div id='middle_column'>
      <div id='menu'>
        <member></member>
        <div style="text-align: center; float: left; width: 60px; margin: 0 5px 20px 0; padding-top: 5px">
        <img src="./../assets/App icons/icon_chat_01.svg" style="width:45px" routerLink="/chat" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Chat</div>
        </div>
        <div style="text-align: center; float: left; width: 60px; margin: 0 5px 20px 0; padding-top: 5px">
        <img src="./../assets/App icons/icon_share_01.svg" style="width:45px" routerLink="/wallet" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Wallet</div>
        </div>
        <div style="text-align: center; float: left;  width: 60px; margin: 0 5px 20px 0; padding-top: 5px">
        <img src="./../assets/App icons/icon_winner_gradient.svg" style="width:45px; border-radius:4px;" routerLink="/team" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Team</div>
        </div>
        <div style="color:white; clear:left; float: left; font-size:10px;">{{ (currentTeam | async)?.name }}</div>
        <div style="color:white; font-size:10px; float: right; cursor: pointer" (click)="this.router.navigate(['login']);">login/logout</div>
      </div>
      <div id='app_container'>
        <router-outlet></router-outlet>
      </div>
    </div>
  </div>
  `,
})
export class AppComponent {
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
        if (auth == null) {
          this.currentUserID = "";
          this.firstName = "";
          this.lastName = "";
          this.photoURL = "./../assets/App icons/me.png";
          this.currentTeamID = "";
          this.currentTeam = null;
        }
        else {
          this.currentUserID = auth.uid;
          this.currentUser = db.object('users/' + (auth ? auth.uid : "logedout"));
          this.currentUser.subscribe(snapshot => {
            this.firstName = snapshot.firstName;
            this.lastName = snapshot.lastName;
            this.photoURL = snapshot.photoURL;
            this.currentTeamID = snapshot.currentTeam;
            this.currentTeam = db.object('teams/' + this.currentTeamID);
          });
        }
    });
  }

}

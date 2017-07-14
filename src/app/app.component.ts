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
      <div class='menu'>
      <img src="{{ (currentTeam | async)?.photoURL }}" style="height:30px; width: 100%; object-fit:cover">
        <div>
        <div style="padding: 5px 10px 5px 10px; color:white; float: left; font-size:10px;">{{ (currentTeam | async)?.name }}</div>
        <div style="padding: 5px 10px 5px 10px; color:white; font-size:10px; float: right; cursor: pointer" (click)="this.router.navigate(['login']);">admin</div>
        </div>
        <member></member>
        <div class='icon'>
        <img src="./../assets/App icons/icon_chat_01.svg" style="width:45px" routerLink="/chat" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Chat</div>
        </div>
        <div class='icon'>
        <img src="./../assets/App icons/icon_share_01.svg" style="width:45px" routerLink="/wallet" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Wallet</div>
        </div>
        <div class='icon'>
        <img src="./../assets/App icons/icon_winner_gradient.svg" style="width:45px; border-radius:3px;" routerLink="/teamSettings" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Team</div>
        </div>
      </div>
      <div id='app_container'>
        <messageCenter></messageCenter>
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

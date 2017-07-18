import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, NavigationEnd } from '@angular/router'

@Component({
  selector: 'app-root',
  template: `
  <div id='main_container'>
    <div id='middle_column'>
      <div class='menu' id='menu'>
        <div>
        <div style="padding: 5px 10px 5px 10px; color:white; float: left; font-size:10px;">{{ (currentTeam | async)?.name }}</div>
        <div style="padding: 5px 10px 5px 10px; color:white; font-size:10px; float: right; cursor: pointer" (click)="this.router.navigate(['login']);">admin</div>
        </div>
        <member></member>
        <div class='icon'>
        <img id='chatIcon' src="./../assets/App icons/icon_chat_01.svg" style="width:45px" routerLink="/chat" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Chat</div>
        <div class='activity' id='activityChat'></div>
        </div>
        <div class='icon'>
        <img src="./../assets/App icons/icon_share_01.svg" style="width:45px" routerLink="/wallet" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Wallet</div>
        </div>
        <div class='icon'>
        <img src="./../assets/App icons/icon_winner_gradient.svg" style="width:45px; border-radius:3px;" routerLink="/teamSettings" routerLinkActive="active">
        <div style="font-size: 9px; color: #FFF;">Team</div>
        <div class='activity' [hidden]="!this.globalChatActivity"></div>
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
  currentTeamActivities: FirebaseObjectObservable<any>;
  teamActivities: FirebaseObjectObservable<any>;
  userTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  globalChatActivity: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    var startupBackgroundImage;
    startupBackgroundImage = 'url("https://upload.wikimedia.org/wikipedia/commons/d/d7/Oslo%2C_Norway_1952_%2812350700414%29.jpg")';
    startupBackgroundImage = 'url("https://upload.wikimedia.org/wikipedia/commons/9/93/GoldenGateBridge_BakerBeach_MC.jpg")';
    this.afAuth.authState.subscribe((auth) => {
      if (auth == null) {
        this.currentUserID = "";
        this.firstName = "";
        this.lastName = "";
        this.photoURL = "./../assets/App icons/me.png";
        this.currentTeamID = "";
        this.currentTeam = null;
        document.getElementById('menu').style.backgroundImage = startupBackgroundImage;
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
          this.currentTeam.subscribe(currentTeam=>{
            document.getElementById('menu').style.backgroundImage = 'url(' + (currentTeam.photoURL?currentTeam.photoURL:startupBackgroundImage) + ')';
          });
          db.list('userTeams/'+this.currentUserID).subscribe(userTeams=>{
            this.globalChatActivity = false;
            console.log("loopUserTeam");
            userTeams.forEach(userTeam=>{
              db.object('teamActivities/'+userTeam.$key).subscribe(teamActivities=>{
                var chatActivity = (teamActivities.lastMessageTimestamp > userTeam.lastChatVisitTimestamp);
                if (userTeam.$key == this.currentTeamID) {
                  if (chatActivity) {document.getElementById('activityChat').style.display = 'inherit'}
                  else {document.getElementById('activityChat').style.display = 'none'}
                }
                this.globalChatActivity = chatActivity?true:this.globalChatActivity;
                console.log("loopActivity");
              });
            });
          });
        });
      }
    });
  }

}

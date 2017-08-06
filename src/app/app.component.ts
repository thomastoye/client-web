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
      <div [hidden]="!loggedIn">
      <div [hidden]="!emailVerified">
      <div class='menu' id='menu'>
        <div>
        <div style="padding: 5px 10px 5px 10px; color:white; float: left; font-size:10px;">{{ currentTeamName }}</div>
        <div style="padding: 5px 10px 5px 10px; color:white; font-size:10px; float: right; cursor: pointer" (click)="this.logout(); router.navigate(['login']);">logout</div>
        </div>
        <div class='icon' (click)="router.navigate(['members'])">
        <img (error)="errorHandler($event)"id='chatIcon' src="./../assets/App icons/icon_guest.svg" style="width:45px">
        <div style="font-size: 9px; color: #FFF;">Members</div>
        </div>
        <div class='icon' (click)="router.navigate(['projectProfile'])">
        <img (error)="errorHandler($event)"id='chatIcon' src="./../assets/App icons/icon_project_01.svg" style="width:45px">
        <div style="font-size: 9px; color: #FFF;">Project</div>
        </div>
        <div class='icon' (click)="router.navigate(['chat'])">
        <img (error)="errorHandler($event)"id='chatIcon' src="./../assets/App icons/icon_chat_01.svg" style="width:45px">
        <div style="font-size: 9px; color: #FFF;">Chat</div>
        <div class='activity' [hidden]="!currentTeamChatActivity"></div>
        </div>
        <div class='icon' (click)="router.navigate(['wallet'])">
        <img (error)="errorHandler($event)" src="./../assets/App icons/icon_share_01.svg" style="width:45px">
        <div style="font-size: 9px; color: #FFF;">Wallet</div>
        </div>
        <div class='icon' (click)="router.navigate(['teamSettings'])">
        <img (error)="errorHandler($event)" src="./../assets/App icons/icon_winner_gradient.svg" style="width:45px; border-radius:3px;">
        <div style="font-size: 9px; color: #FFF;">Teams</div>
        <div class='activity' [hidden]="!globalChatActivity"></div>
        </div>
        </div>
        </div>
      </div>
      <div id='app_container'>
        <router-outlet></router-outlet>
      </div>
    </div>
  </div>
  `,
})
export class AppComponent {
  globalChatActivity: boolean;
  currentTeamChatActivity: boolean;
  loggedIn: boolean;
  emailVerified: boolean;
  currentTeamName: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      console.log("loop 1");
      if (auth == null) {this.loggedIn = false}
      else {
        this.loggedIn = true;
        if (!auth.emailVerified) {this.emailVerified = false}
        else {this.emailVerified = true}
        db.object('userInterface/'+auth.uid+'/currentTeam').subscribe(currentTeamID => {
          console.log("loop 2");
          db.object('teams/' + currentTeamID.$value).subscribe(currentTeamObject=>{
            console.log("loop 3");
            this.currentTeamName = currentTeamObject.name;
            this.db.object('appSettings/').subscribe(appSettings=>{
              console.log("loop 4");
              document.getElementById('menu').style.backgroundImage = 'url(' + (currentTeamObject.photoURL?currentTeamObject.photoURL:appSettings.teamBackgroundImage) + ')';
              db.list('userTeams/'+auth.uid).subscribe(userTeams=>{
                console.log("loop 5");
                this.globalChatActivity = false;
                this.currentTeamChatActivity = false;
                userTeams.forEach(userTeam=>{
                  if (userTeam.following) {
                    db.object('teamActivities/'+userTeam.$key+'/lastMessageTimestamp').subscribe(lastMessageTimestamp=>{
                      console.log("loop 6");
                      var chatActivity = (lastMessageTimestamp.$value > userTeam.lastChatVisitTimestamp);
                      if (userTeam.$key==currentTeamID.$value&&chatActivity) {this.currentTeamChatActivity=true}
                      this.globalChatActivity = chatActivity?true:this.globalChatActivity;
                      document.title=this.globalChatActivity?"(!) PERRINN":"PERRINN";
                    });
                  }
                });
              });
            });
          });
        });
      }
    });
  }

  logout() {
    this.afAuth.auth.signOut()
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

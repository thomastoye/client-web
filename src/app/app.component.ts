import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, NavigationEnd } from '@angular/router'

@Component({
  selector: 'app-root',
  template: `
    <div [hidden]="!loggedIn">
    <div [hidden]="!emailVerified">
    <progress value='0' max='100' id='uploader'>0%</progress>
    <div class='menu'>
    <div style="width:325px;display:block;margin: 0 auto;">
    <div class='iconSmall' [class.selected]="selectedIcon===1" (click)="router.navigate(['teamProfile']);selectedIcon=1">
    <img (error)="errorHandler($event)"id='chatIcon' src="./../assets/App icons/icon_project_01.svg" style="width:30px;margin-top:5px;">
    </div>
    <div class='iconSmall' [class.selected]="selectedIcon===2" (click)="router.navigate(['chat']);selectedIcon=2">
    <img (error)="errorHandler($event)"id='chatIcon' src="./../assets/App icons/icon_chat_01.svg" style="width:30px;margin-top:5px;">
    <div class='activity' [hidden]="!currentTeamChatActivity"></div>
    </div>
    <div class='iconSmall' [class.selected]="selectedIcon===3" (click)="router.navigate(['wallet']);selectedIcon=3">
    <img (error)="errorHandler($event)" src="./../assets/App icons/icon_share_01.svg" style="width:30px;margin-top:5px;">
    </div>
    <div class='iconSmall' [class.selected]="selectedIcon===4" (click)="db.object('userInterface/'+currentUserID).update({focusUser:currentUserID});router.navigate(['userProfile']);selectedIcon=4">
    <img (error)="errorHandler($event)" src="./../assets/App icons/icon_winner_gradient.svg" style="width:30px;margin-top:5px;border-radius:3px;">
    <div class='activity' [hidden]="!globalChatActivity"></div>
    </div>
    <div class='iconSmall' [class.selected]="selectedIcon===5" (click)="router.navigate(['search']);selectedIcon=5">
    <img (error)="errorHandler($event)" src="./../assets/App icons/search.png" style="width:30px;margin-top:5px;border-radius:3px;-webkit-filter: brightness(100); filter: brightness(100);">
    </div>
    </div>
    </div>
    </div>
    </div>
    <div id='main_container'>
    <div style="height:40px;width:100%;z-index:1"></div>
    <router-outlet></router-outlet>
    </div>
  `,
})
export class AppComponent {
  globalChatActivity: boolean;
  currentTeamChatActivity: boolean;
  loggedIn: boolean;
  emailVerified: boolean;
  followingCurrentTeam: boolean;
  currentUserID: string;
  currentTeamID: string;
  selectedIcon: number;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.followingCurrentTeam=true;
    this.afAuth.authState.subscribe((auth) => {
      console.log("loop 1");
      if (auth == null) {this.loggedIn = false}
      else {
        this.currentUserID = auth.uid;
        this.loggedIn = true;
        if (!auth.emailVerified) {this.emailVerified = false}
        else {this.emailVerified = true}
        db.object('userInterface/'+auth.uid+'/currentTeam').subscribe(currentTeamID => {
          this.currentTeamID=currentTeamID.$value;
          console.log("loop 2");
          db.list('userTeams/'+auth.uid).subscribe(userTeams=>{
            console.log("loop 5");
            this.followingCurrentTeam=false;
            this.globalChatActivity = false;
            this.currentTeamChatActivity = false;
            userTeams.forEach(userTeam=>{
              if (userTeam.following) {
                db.object('teamActivities/'+userTeam.$key+'/lastMessageTimestamp').subscribe(lastMessageTimestamp=>{
                  console.log("loop 6");
                  var chatActivity = (lastMessageTimestamp.$value > userTeam.lastChatVisitTimestamp);
                  if (userTeam.$key==currentTeamID.$value&&chatActivity) {this.currentTeamChatActivity=true}
                  if (userTeam.$key==currentTeamID.$value) {this.followingCurrentTeam=userTeam.following}
                  this.globalChatActivity = chatActivity?true:this.globalChatActivity;
                  document.title=this.globalChatActivity?"(!) PERRINN":"PERRINN";
                });
              }
            });
          });
        });
      }
    });
  }

  ngOnInit () {
    document.getElementById('uploader').style.visibility = "hidden";
  }

  followTeam () {
    this.db.object('userTeams/'+this.currentUserID+'/'+this.currentTeamID).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
    this.db.object('userInterface/'+this.currentUserID).update({currentTeam: this.currentTeamID});
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

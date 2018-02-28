import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, NavigationEnd } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'app-root',
  template: `
    <img class="fullScreenImage" id="fullScreenImage" (click)="hideFullScreenImage()">
    <progress value='0' max='100' id='uploader'>0%</progress>
    <div class='menu'>
    <div style="width:300px;display:block;margin: 0 auto;">
    <div class='iconSmall' (click)="clickUserIcon()">
    <img src="./../assets/App icons/Perrinn_02.png" style="width:30px;margin-top:5px;border-radius:3px;">
    <div class='activity' [hidden]="!globalChatActivity"></div>
    </div>
    <div class='iconSmall' (click)="router.navigate(['search'])">
    <img src="./../assets/App icons/search.png" style="width:30px;margin-top:5px;border-radius:3px;-webkit-filter:brightness(100);filter:brightness(100);">
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

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null) {}
      else {
        var notificationSound= new Audio("./../assets/Sounds/micro.mp3");
        db.list('userTeams/'+this.UI.currentUser).subscribe(userTeams=>{
          console.log("loop 5");
          this.globalChatActivity = false;
          this.currentTeamChatActivity = false;
          userTeams.forEach(userTeam=>{
            if (userTeam.following) {
              db.object('teamActivities/'+userTeam.$key+'/lastMessageTimestamp').subscribe(lastMessageTimestamp=>{
                console.log("loop 6");
                var chatActivity = (lastMessageTimestamp.$value > userTeam.lastChatVisitTimestamp);
                if (userTeam.$key==UI.currentTeam&&chatActivity) {this.currentTeamChatActivity=true}
                this.globalChatActivity = chatActivity?true:this.globalChatActivity;
                document.title=this.globalChatActivity?"(!) PERRINN":"PERRINN";
              });
            }
          });
        });
      }
    });
  }

  ngOnInit () {
    document.getElementById('uploader').style.visibility = "hidden";
    document.getElementById("fullScreenImage").style.visibility='hidden';
  }

  hideFullScreenImage(){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.style.visibility='hidden';
    fullScreenImage.src="";
  }

  clickUserIcon () {
    if (this.UI.currentUser) {
      this.router.navigate(['user',this.UI.currentUser]);
    }
    else {
      this.router.navigate(['login']);
    }
  }

  followTeam () {
    this.db.object('userTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
  }

}

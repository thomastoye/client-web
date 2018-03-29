import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, NavigationEnd } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'app-root',
  template: `
    <img class="fullScreenImage" id="fullScreenImage" (click)="hideFullScreenImage()">
    <progress value='0' max='100' id='uploader'>0%</progress>
    <div *ngIf="DB.getPERRINNGlobalMessage()" style="text-align:center;margin:5px;color:red;font-size:10px">{{DB.getPERRINNGlobalMessage()}}</div>
    <div class='menu'>
    <div style="width:350px;display:block;margin: 0 auto;">
    <div class='iconSmall' (click)="clickUserIcon()">
    <img src="./../assets/App icons/Perrinn_02.png" style="width:30px;margin-top:5px;border-radius:3px;">
    <div class='activity' [hidden]="!globalChatActivity"></div>
    </div>
    <div style="text-align:center;width:200px;height:40px;cursor:pointer;float:left" (click)="router.navigate(['team',UI.currentTeam])">
        <div *ngIf="UI.currentTeam" style="height:40px">
        <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoThumb(UI.currentTeam)" style="opacity:.6;object-fit:cover;margin-top:5px;height:30px;width:200px;border-radius:3px">
        <div style="position:absolute;width:200px;top:10px;text-align:center;color:#fff;font-size:10px;line-height:20px">{{DB.getTeamName(UI.currentTeam)}}{{(DB.getTeamLeader(UI.currentTeam,UI.currentUser)?" *":"")}}</div>
        </div>
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

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null) {}
      else {
        db.list('userTeams/'+this.UI.currentUser).subscribe(userTeams=>{
          console.log("loop 5");
          this.globalChatActivity = false;
          userTeams.forEach(userTeam=>{
            if (userTeam.following) {
              db.object('teamActivities/'+userTeam.$key+'/lastMessageTimestamp').subscribe(lastMessageTimestamp=>{
                console.log("loop 6");
                var chatActivity = (lastMessageTimestamp.$value > userTeam.lastChatVisitTimestamp);
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

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

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
    <div style="float:left;width:20%">
      <div class='iconSmall' (click)="clickUserIcon()">
      <img src="./../assets/App icons/Perrinn_02.png" style="width:30px;margin-top:5px;border-radius:3px;">
      <div class='activity' [hidden]="!globalChatActivity"></div>
      </div>
    </div>
    <div style="float:left;width:60%">
      <div style="text-align:center;width:200px;height:40px;cursor:pointer;display:block;margin: 0 auto" (click)="router.navigate(['team',UI.currentTeam])">
          <div *ngIf="UI.currentTeam" style="height:40px">
          <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoThumb(UI.currentTeam)" style="opacity:.6;object-fit:cover;margin-top:5px;height:30px;width:200px;border-radius:3px">
          <div style="position:absolute;width:200px;top:10px;text-align:center;color:#fff;font-size:10px;line-height:20px">{{DB.getTeamName(UI.currentTeam)}}{{(DB.getTeamLeader(UI.currentTeam,UI.currentUser)?" *":"")}}</div>
          </div>
      </div>
    </div>
    <div style="float:left;width:20%">
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
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
  }

}

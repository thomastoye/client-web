import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import { firebase } from '@firebase/app';
import { Router, NavigationEnd } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'app-root',
  template: `
    <img class="fullScreenImage" id="fullScreenImage" (click)="hideFullScreenImage()">
    <progress value='0' max='100' id='uploader'>0%</progress>
    <div class='menu'>
    <div style="width:320px;display:block;margin: 0 auto">
    <div style="float:left;text-align:center;line-height:40px;width:20px;font-size:20px;cursor:pointer" (click)="goBack()">&#9001;</div>
    <div class='iconSmall' (click)="clickUserIcon()">
    <img src="./../assets/App icons/Perrinn_02.png" style="width:30px;margin-top:5px;border-radius:3px;">
    <div class='activity' [hidden]="!globalChatActivity"></div>
    </div>
    <div style="text-align:center;width:170px;height:40px;cursor:pointer;float:left" (click)="router.navigate(['team',UI.currentTeam])">
        <div *ngIf="UI.currentTeam" style="height:40px">
        <img *ngIf="UI.currentTeamObj?.imageUrlThumb" [src]="UI.currentTeamObj?.imageUrlThumb" style="opacity:.6;object-fit:cover;margin-top:5px;height:30px;width:170px;border-radius:3px">
        <div style="position:absolute;width:170px;top:10px;text-align:center;color:#fff;font-size:10px;line-height:20px">{{UI.currentTeamObj?.name}}</div>
        </div>
    </div>
    <div class='iconSmall' (click)="router.navigate(['search'])">
    <img src="./../assets/App icons/search.png" style="width:30px;margin-top:5px;border-radius:3px;-webkit-filter:brightness(100);filter:brightness(100);">
    </div>
    <div style="float:left;text-align:center;line-height:40px;width:20px;font-size:20px;cursor:pointer" (click)="goForward()">&#9002;</div>
    </div>
    </div>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  globalChatActivity:boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService) {
    localStorage.clear();
    this.afAuth.authState.subscribe((auth) => {
      db.list('viewUserTeams/'+this.UI.currentUser).snapshotChanges().subscribe(viewUserTeams=>{
        this.globalChatActivity=false;
        viewUserTeams.forEach(userTeam=>{
          var chatActivity = (userTeam.payload.val().lastMessageTimestamp > userTeam.payload.val().lastChatVisitTimestamp);
          if(chatActivity){
            this.globalChatActivity=true;
          }
          document.title=this.globalChatActivity?"(!) PERRINN":"PERRINN";
        });
      });
    });
  }

  goBack() {
      window.history.back();
  }

  goForward() {
      window.history.forward();
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

}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'help',
  template: `
  <div class="sheet" style="background-color:#f5f5f5">
  <div style="position:fixed;width:100px;font-size:12px;cursor:pointer;color:blue;text-align:center;float:left;background-color:#eff5ff;padding:5px" (click)="router.navigate(['chat',UI.currentTeam])">< Chat</div>
  <div class="title" style="margin-top:30px">What do you want to do?</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let service of services | async">
      <div style="padding:5px 10px 5px 10px">
        <div style="float:left;width:250px;font-size:11px;font-weight:bold;color:blue;cursor:pointer" (click)="addMessage(service.regex )">{{service.regex}}</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  <div style="text-align:center;padding:10px"><a style="font-size:10px" href='mailto:perrinnlimited@gmail.com'>Stuck? no problem, email PERRINN now</a></div>
  </div>
  `,
})
export class HelpComponent {
  services: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.services=db.list('appSettings/PERRINNServices', {
      query:{
        orderByChild:'regex',
      }
    });
  }

  addMessage(text) {
    this.UI.processNewMessage(text).then(isProcessReady=>{
      firebase.database().ref('teamServices/'+this.UI.currentTeam+'/process').once('value',process=>{
        var processData=isProcessReady?process.val():null;
        const now = Date.now();
        var messageID=firebase.database().ref('teamMessages/'+this.UI.currentTeam).push({
          timestamp:now,
          text:text,
          user:this.UI.currentUser,
          firstName:this.DB.getUserFirstName(this.UI.currentUser),
          imageUrlThumbUser:this.DB.getUserImageUrlThumb(this.UI.currentUser),
          process:processData,
        }).key;
        if (isProcessReady) {
          this.db.object('teamServices/'+this.UI.currentTeam+'/process').update({
            messageID:messageID,
          });
        }
        this.db.object('teamActivities/'+this.UI.currentTeam).update({
          lastMessageTimestamp:now,
          lastMessageText:text,
          lastMessageUser:this.UI.currentUser,
        });
        this.db.object('userTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).update({
          lastChatVisitTimestamp:now,
          lastChatVisitTimestampNegative:-1*now,
        });
        this.router.navigate(['chat',this.UI.currentTeam])
      });
    });
  }

}

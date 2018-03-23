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
  <div style="width:100px;font-size:12px;cursor:pointer;color:blue;padding:10px;float:left" (click)="router.navigate(['chat',UI.currentTeam])">< Chat</div>
  <div class="title">Chat commands</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let service of services | async">
      <div style="padding:5px 10px 5px 10px">
        <div style="float:left;width:200px;font-size:11px;font-weight:bold">{{service.command}}</div>
        <div style="float:left;width:200px;font-size:11px">{{service.description}}</div>
        <div *ngIf="UI.currentTeam" class="buttonDiv" style="font-size:11px;color:blue" (click)="addMessage(service.command)">Send to chat</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  <div style="text-align:center;padding:10px"><a style="font-size:10px" href='mailto:perrinnlimited@gmail.com'>Stuck? no problem just email PERRINN now</a></div>
  </div>
  `,
})
export class HelpComponent {
  services: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.services=db.list('appSettings/PERRINNServices', {
      query:{
        orderByChild:'command',
      }
    });
  }

  addMessage(text) {
    const now = Date.now();
    this.db.list('teamMessages/'+this.UI.currentTeam).push({
      timestamp:now,
      text:text,
      user:this.UI.currentUser,
    });
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
  }

}

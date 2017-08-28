import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'chat',
  template: `
  <div class="sheet">
  <div class="chat" id="chat-scroll">
  <div>
  <div style="color:blue; padding:10px 0 10px 0; cursor:pointer; text-align:center" (click)="messageNumberDisplay=messageNumberDisplay+25;this.teamMessages = this.db.list('teamMessages/' + this.currentTeamID, {query: {limitToLast: messageNumberDisplay}});">More messages</div>
  <ul style="list-style: none;">
    <li *ngFor="let message of teamMessages | async ; let last = last">
    <div style="display: inline; float: left; height:35px; width:2px">
    <div [hidden]="lastChatVisitTimestamp>message.timestamp" style="height:35px;width:2px;background-color:red"></div>
    </div>
    <img (error)="errorHandler($event)"[src]="(db.object('users/' + message.author) | async)?.photoURL" style="display: inline; float: left; margin: 0 10px 10px 10px; border-radius:3px; object-fit: cover; height:35px; width:35px">
    <div style="font-weight: bold; display: inline; float: left; margin-right: 10px">{{(db.object('users/' + message.author) | async)?.firstName}}</div>
    <div style="color: #AAA;">{{message.timestamp | date:'medium'}}</div>
    <div style="padding: 0 50px 10px 0;" [innerHTML]="message.text | linky"></div>
    {{last?scrollToBottom():''}}
    </li>
  </ul>
  </div>
  <ul style="list-style: none;">
    <li *ngFor="let author of draftMessageAuthors | async">
    <div [hidden]="!author.draftMessage||author.$key==currentUserID" style="padding-left:25px;font-weight:bold">{{(db.object('users/'+author.$key)|async)?.firstName}} ...</div>
    </li>
  </ul>
  </div>
  <div style="color:blue; padding:5px 0 5px 15px; cursor:pointer" (click)="timestampChatVisit()">Mark all read</div>
  <input maxlength="500" style="border-style: solid; border-width: thin;" type="text" (keydown.enter)="addMessage()" (keyup)="updateDraftMessageDB()" [(ngModel)]="draftMessage" placeholder={{messageInput}} />
  </div>
    `,
})
export class ChatComponent {
  draftMessage: string;
  draftMessageDB: boolean;
  draftMessageAuthors: FirebaseListObservable<any>;
  teamMessages: FirebaseListObservable<any>;
  currentUserID: string;
  currentTeamID: string;
  newMemberID: string;
  messageInput: string;
  messageNumberDisplay: number;
  lastChatVisitTimestamp: number;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase) {
    this.messageNumberDisplay = 25;
    this.draftMessageDB=false;
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        db.object('userInterface/'+auth.uid).subscribe(userInterface => {
          this.messageNumberDisplay = 25;
          this.currentTeamID = userInterface.currentTeam;
          this.teamMessages = this.db.list('teamMessages/' + this.currentTeamID, {query: {limitToLast: this.messageNumberDisplay}});
          this.draftMessageAuthors = this.db.list('teamActivities/'+this.currentTeamID+'/draftMessages/');
          this.db.object('teamUsers/'+this.currentTeamID+'/'+auth.uid).subscribe(teamUser=>{
            if (teamUser==null) {this.messageInput="You need to be a member to message this team"}
            else {this.messageInput = teamUser.member?"Message team":"You need to be a member to message this team"}
          });
          this.db.object('userTeams/'+this.currentUserID+'/'+this.currentTeamID).subscribe(userTeam=>{
            this.lastChatVisitTimestamp = Number(userTeam.lastChatVisitTimestamp);
          });
        });
      }
    });
  }

  scrollToBottom() {
    var element = document.getElementById("chat-scroll");
    element.scrollTop = element.scrollHeight;
  }

  timestampChatVisit(){
    this.db.object('userTeams/'+this.currentUserID+'/'+this.currentTeamID).update({lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
  }

  addMessage() {
    if (this.draftMessage!="") {
    this.db.object('teamActivities/'+this.currentTeamID).update({lastMessageTimestamp: firebase.database.ServerValue.TIMESTAMP});
    var messageKey = this.db.list('teamMessages/' + this.currentTeamID).push({ timestamp: firebase.database.ServerValue.TIMESTAMP, text: this.draftMessage, author: this.currentUserID}).key;
    this.addMessageTimestampNegative (this.currentTeamID, messageKey);
    this.draftMessage = "";
    }
  }

  addMessageTimestampNegative(teamID: string, messageID: string) {
    var timestamp: number;
    var timestampNegative: number;
    this.db.object('teamMessages/'+teamID+'/'+messageID).subscribe(message=>{
      timestamp = message.timestamp;
      timestampNegative = -1 * timestamp;
      this.db.object('teamMessages/'+teamID+'/'+messageID).update({timestampNegative: timestampNegative});
    });
  }

  updateDraftMessageDB () {
    if ((this.draftMessage!="")!=this.draftMessageDB) {
      this.db.object('teamActivities/'+this.currentTeamID+'/draftMessages/'+this.currentUserID).update({draftMessage:this.draftMessage!=""});
    }
    this.draftMessageDB=(this.draftMessage!="");
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

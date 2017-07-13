import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'chat',
  template: `
  <div class="chat" id="chat-scroll">
  <div>
  <ul style="list-style: none;">
    <li *ngFor="let message of teamMessages | async">
    <img [src]="(db.object('users/' + message.author) | async)?.photoURL" style="display: inline; float: left; margin: 0 10px 10px 10px; border-radius:4px; object-fit: cover; height:35px; width:35px">
    <div style="font-weight: bold; display: inline; float: left; margin-right: 10px">{{(db.object('users/' + message.author) | async)?.firstName}}</div>
    <div style="color: #AAA;">{{message.timestamp | date:'shortTime'}}</div>
    <div style="padding: 0 50px 10px 0;">{{message.text}}</div>
    </li>
  </ul>
  </div>
  </div>
  <div class="chat-input">
  <input style="border-style: solid; border-width: thin;" type="text" (keydown.enter)="addMessage()" [(ngModel)]="draftMessage" />
  </div>
    `,
})
export class ChatComponent {
  draftMessage: string;
  teamMessages: FirebaseListObservable<any>;
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  firstName= "";
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  teams: FirebaseListObservable<any>;
  teamUsers: FirebaseListObservable<any>;
  newMemberID: string;
  photoURL: string;


  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase) {
    this.afAuth.authState.subscribe((auth) => {
      this.currentUserID = auth.uid;
      this.currentUser = db.object('users/' + (auth ? auth.uid : "logedout"));
      this.currentUser.subscribe(snapshot => {
        this.firstName = snapshot.firstName;
        this.photoURL = snapshot.photoURL;
        this.currentTeamID = snapshot.currentTeam;
        this.currentTeam = db.object('teams/' + this.currentTeamID);
        this.teamMessages = this.db.list('teamMessages/' + this.currentTeamID, {query: {limitToLast: 50}});
      });
    });
  }

  addMessage() {
    if (this.draftMessage!="") {
    this.teamMessages.push({ timestamp: firebase.database.ServerValue.TIMESTAMP, text: this.draftMessage, author: this.currentUserID});
    this.draftMessage = "";
    var element = document.getElementById("chat-scroll");
    element.scrollTop = element.scrollHeight;
    }
  }

  deleteMessage(key: string) {
    this.teamMessages.remove(key);
  }
}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { DomSanitizer } from '@angular/platform-browser';
import { Ng2ImgMaxService } from 'ng2-img-max';

@Component({
  selector: 'chat',
  template: `
  <div class="sheet">
  <div class="chat" id="chat-scroll">
  <div>
  <div style="color:blue; padding:10px 0 10px 0; cursor:pointer; text-align:center" (click)="messageNumberDisplay=messageNumberDisplay+25;this.teamMessages = this.db.list('teamMessages/' + this.currentTeamID, {query: {limitToLast: messageNumberDisplay}});">More messages</div>
  <ul style="list-style: none;">
    <li *ngFor="let message of teamMessages | async ; let last = last ; let i = index">
    <div class="newDay" *ngIf="isMessageNewGroup(message.timestamp)">{{message.timestamp|date:'yMMMMEEEEd'}}</div>
    <div style="display: inline; float: left; height:35px; width:2px">
    <div [hidden]="lastChatVisitTimestamp>message.timestamp" style="height:35px;width:2px;background-color:red"></div>
    </div>
    <img (error)="errorHandler($event)" [src]="getPhotoURL(message.author)" style="display: inline; float: left; margin: 0 10px 10px 10px; border-radius:3px; object-fit: cover; height:35px; width:35px">
    <div style="font-weight: bold; display: inline; float: left; margin-right: 10px">{{getFirstName(message.author)}}</div>
    <div style="color: #AAA;">{{message.timestamp | date:'jm'}}</div>
    <div style="padding: 0 50px 10px 0;" [innerHTML]="message.text | linky"></div>
    {{last?scrollToBottom(message.timestamp):''}}
    </li>
  </ul>
  </div>
  </div>
  <div style="color:blue; padding:5px 0 5px 15px; cursor:pointer;float:left" (click)="timestampChatVisit()">Mark all read</div>
  <ul style="list-style: none;">
    <li *ngFor="let author of draftMessageAuthors | async">
    <div [hidden]="!author.draftMessage||author.$key==currentUserID" *ngIf="isDraftMessageRecent(author.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{getFirstName(author.$key)}}...</div>
    </li>
  </ul>
  <textarea class="textAreaChat" maxlength="500" (keyup.enter)="addMessage()" (keyup)="updateDraftMessageDB()" [(ngModel)]="draftMessage" placeholder={{messageInput}}></textarea>
  <input type="file" (change)="onImageChange($event)" accept="image/*">
  <div style="float:right;padding:15px">{{draftImage.length/1000|number:'1.0-0'}}kb</div>
  <img *ngIf="draftImage" [src]="sanitizer.bypassSecurityTrustUrl(draftImage)" style="clear:left;width:70%;max-height:300px;object-fit:contain;">
  </div>
    `,
})
export class ChatComponent {
  draftMessage: string;
  uploadedImage: File;
  draftImage: string;
  draftMessageDB: boolean;
  draftMessageAuthors: FirebaseListObservable<any>;
  teamMessages: FirebaseListObservable<any>;
  currentUserID: string;
  currentTeamID: string;
  newMemberID: string;
  messageInput: string;
  messageNumberDisplay: number;
  lastChatVisitTimestamp: number;
  scrollMessageTimestamp: number;
  previousMessageTimestamp: number;

  constructor(private ng2ImgMax: Ng2ImgMaxService, public sanitizer: DomSanitizer, public afAuth: AngularFireAuth, public db: AngularFireDatabase) {
    this.previousMessageTimestamp=0;
    this.messageNumberDisplay = 25;
    this.draftMessageDB=false;
    this.draftImage="";
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

  isMessageNewGroup (messageTimestamp) {
    var isMessageNewGroup: boolean;
    isMessageNewGroup= Math.abs(messageTimestamp-this.previousMessageTimestamp)>1000*60*60*4;
    this.previousMessageTimestamp=messageTimestamp;
    return isMessageNewGroup;
  }

  isDraftMessageRecent (draftMessageTimestamp) {
    return (Date.now()-draftMessageTimestamp)<1000*60;
  }

  scrollToBottom(scrollMessageTimestamp: number) {
    if (scrollMessageTimestamp!=this.scrollMessageTimestamp) {
      var element = document.getElementById("chat-scroll");
      element.scrollTop = element.scrollHeight;
      this.scrollMessageTimestamp=scrollMessageTimestamp;
    }
  }

  timestampChatVisit(){
    this.db.object('userTeams/'+this.currentUserID+'/'+this.currentTeamID).update({lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
  }

  addMessage() {
    this.draftMessage = this.draftMessage.replace(/(\r\n|\n|\r)/gm,"");
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
      this.db.object('teamActivities/'+this.currentTeamID+'/draftMessages/'+this.currentUserID).update({draftMessage:this.draftMessage!="",draftMessageTimestamp:firebase.database.ServerValue.TIMESTAMP});
    }
    this.draftMessageDB=(this.draftMessage!="");
  }

  getFirstName (ID: string) :string {
    var output;
    this.db.object('users/' + ID).subscribe(snapshot => {
      output = snapshot.firstName;
    });
    return output;
  }

  getPhotoURL (ID: string) :string {
    var output;
    this.db.object('users/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

  onImageChange(event) {
    let image = event.target.files[0];

    this.ng2ImgMax.resizeImage(image, 500, 500).subscribe(
      result => {
        this.uploadedImage = new File([result], result.name);
        this.getDraftImage(this.uploadedImage);
      },
      error => {
        console.log('😢 Oh no!', error);
      }
    );
  }

  getDraftImage(file: File) {
    const reader: FileReader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.draftImage = reader.result;
    };
  }

}

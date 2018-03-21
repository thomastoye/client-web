import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import 'firebase/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'chat',
  template: `
  <div class="sheet">
  <div class="chat" id="chat-scroll">
  <div>
  <div style="color:blue; padding:10px 0 10px 0; cursor:pointer; text-align:center" (click)="messageNumberDisplay=messageNumberDisplay+15;this.teamMessages = this.db.list('teamMessages/'+this.UI.currentTeam,{query: {limitToLast: messageNumberDisplay}});">More messages</div>
  <ul style="list-style: none;">
    <li *ngFor="let message of teamMessages | async ; let last = last">
      <div class="newDay" *ngIf="isMessageNewGroup(message.timestamp)">{{message.timestamp|date:'yMMMMEEEEd'}}</div>
      <div style="display: inline; float: left; height:35px; width:5px"></div>
      <div style="display: inline; float: left; height:35px; width:3px">
      <div [hidden]="lastChatVisitTimestamp>=message.timestamp" style="height:35px;width:3px;background-color:red"></div>
      </div>
      <img (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(message.user)" style="cursor:pointer;display: inline; float: left; margin: 0 10px 10px 5px; border-radius:3px; object-fit: cover; height:35px; width:35px" (click)="router.navigate(['user',message.user])">
      <div style="font-weight: bold; display: inline; float: left; margin-right: 10px">{{DB.getUserFirstName(message.user)}}</div>
      <div style="color: #AAA;">{{message.timestamp | date:'jm'}}</div>
      <img *ngIf="message.action=='transaction'" src="./../assets/App icons/icon_share_03.svg" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
      <img *ngIf="message.action=='confirmation'" src="./../assets/App icons/tick.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
      <img *ngIf="message.action=='warning'" src="./../assets/App icons/warning.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
      <img *ngIf="message.action=='process'" src="./../assets/App icons/process.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
      <div style="color: #404040;padding: 0 50px 10px 0;" [innerHTML]="message.text | linky"></div>
      <div *ngIf="message.linkTeam" style="float:left;cursor:pointer;margin: 0 5px 10px 100px">
        <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(message.linkTeam)" style="float:left;object-fit:cover;height:25px;width:40px;border-radius:3px" (click)="router.navigate(['team',message.linkTeam])">
        <div style="font-size:11px;padding:5px;">{{DB.getTeamName(message.linkTeam)}}</div>
      </div>
      <div *ngIf="message.linkUser" style="float:left;cursor:pointer;margin: 0 5px 10px 100px">
        <img (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(message.linkUser)" style="float:left;object-fit:cover;height:25px;width:25px;border-radius:3px" (click)="router.navigate(['user',message.linkUser])">
        <div style="font-size:11px;padding:5px;">{{DB.getUserFirstName(message.linkUser)}} {{DB.getUserLastName(message.linkUser)}}</div>
      </div>
      <img class="imageWithZoom" *ngIf="message.image" [src]="message.image" style="clear:left;width:100%;max-height:350px;object-fit:contain;padding: 0 0 10px 0;" (click)="showFullScreenImage(message.image)">
      {{last?scrollToBottom(message.timestamp):''}}
    </li>
  </ul>
  <div style="height:125px;width:100%"></div>
  </div>
  </div>
  <div class="sheet" style="position: fixed;bottom: 0;width:100%;box-shadow:none">
    <div *ngIf="DB.getUserFollowing(UI.currentUser,UI.currentTeam)" style="color:blue; padding:5px 0 5px 15px; cursor:pointer;float:left" (click)="timestampChatVisit()">Mark all read</div>
    <ul style="list-style:none;float:left;">
      <li *ngFor="let user of draftMessageUsers | async">
      <div [hidden]="!user.draftMessage||user.$key==UI.currentUser" *ngIf="isDraftMessageRecent(user.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{DB.getUserFirstName(user.$key)}}...</div>
      </li>
    </ul>
    <div *ngIf="DB.getTeamBalance(UI.currentTeam)>'0'">
      <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
      <label class="buttonUploadImage" *ngIf='DB.getTeamLeader(UI.currentTeam,UI.currentUser)||DB.getTeamMember(UI.currentTeam,UI.currentUser)' for="chatImage" id="buttonFile" style="float:right;padding:5px 35px 5px 0px;">
      <img src="./../assets/App icons/camera.png" style="width:25px">
      <span class="tipText">Max 3.0Mb</span>
      </label>
    </div>
    <textarea *ngIf="DB.getTeamBalance(UI.currentTeam)>'0'" [hidden]='!(DB.getTeamLeader(UI.currentTeam,UI.currentUser)||DB.getTeamMember(UI.currentTeam,UI.currentUser))' class="textAreaChat" maxlength="500" (keyup.enter)="addMessage()" (keyup)="updateDraftMessageDB()" [(ngModel)]="draftMessage" placeholder="Message team"></textarea>
    <div *ngIf="!(DB.getTeamBalance(UI.currentTeam)>'0')||DB.getTeamBalance(UI.currentTeam)==null" style="font-size:10px;color:red;clear:both;padding:5px 0 5px 15px;cursor:pointer" [hidden]='!(DB.getTeamLeader(UI.currentTeam,UI.currentUser)||DB.getTeamMember(UI.currentTeam,UI.currentUser))' (click)="router.navigate(['wallet',UI.currentTeam])">COIN balance low, please send COINS to this team or buy new COINS to use this chat</div>
  </div>
  </div>
    `,
})
export class ChatComponent {
  draftMessage: string;
  draftImage: string;
  draftMessageDB: boolean;
  draftMessageUsers: FirebaseListObservable<any>;
  teamMessages: FirebaseListObservable<any>;
  messageNumberDisplay: number;
  lastChatVisitTimestamp: number;
  scrollMessageTimestamp: number;
  previousMessageTimestamp: number;

  constructor(public sanitizer: DomSanitizer, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.previousMessageTimestamp=0;
      this.draftMessageDB=false;
      this.draftImage="";
      this.draftMessage="";
      this.messageNumberDisplay = 15;
      this.teamMessages = this.db.list('teamMessages/'+this.UI.currentTeam, {query: {
        limitToLast:this.messageNumberDisplay,
      }});
      this.draftMessageUsers = this.db.list('teamActivities/'+this.UI.currentTeam+'/draftMessages/');
      this.db.object('userTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).subscribe(userTeam=>{
        this.lastChatVisitTimestamp = Number(userTeam.lastChatVisitTimestamp);
      });
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
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
      var element = document.getElementById("main_container");
      element.scrollTop = element.scrollHeight;
      this.scrollMessageTimestamp=scrollMessageTimestamp;
    }
  }

  timestampChatVisit(){
    const now = Date.now();
    this.db.object('userTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).update({
      lastChatVisitTimestamp:now,
      lastChatVisitTimestampNegative:-1*now,
    });
  }

  addMessage() {
    this.draftMessage = this.draftMessage.replace(/(\r\n|\n|\r)/gm,"");
    if (this.draftMessage!=""||this.draftImage!="") {
      const now = Date.now();
      this.db.list('teamMessages/'+this.UI.currentTeam).push({
        timestamp:now,
        text:this.draftMessage,
        image:this.draftImage,
        user:this.UI.currentUser,
        action:"chat"
      });
      this.db.object('teamActivities/'+this.UI.currentTeam).update({
        lastMessageTimestamp:now,
        lastMessageText:this.draftMessage,
        lastMessageUser:this.UI.currentUser,
      });
      this.db.object('userTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).update({
        lastChatVisitTimestamp:now,
        lastChatVisitTimestampNegative:-1*now,
      });
      this.draftMessage = "";
      this.draftImage = "";
    }
  }

  updateDraftMessageDB () {
    if ((this.draftMessage!="")!=this.draftMessageDB) {
      this.db.object('teamActivities/'+this.UI.currentTeam+'/draftMessages/'+this.UI.currentUser).update({draftMessage:this.draftMessage!="",draftMessageTimestamp:firebase.database.ServerValue.TIMESTAMP});
    }
    this.draftMessageDB=(this.draftMessage!="");
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

  onImageChange(event) {
    let image = event.target.files[0];
    var uploader = <HTMLInputElement>document.getElementById('uploader');
    var storageRef = firebase.storage().ref('images/'+Date.now()+image.name);
    var task = storageRef.put(image);
    task.on('state_changed',
      function progress(snapshot){
        document.getElementById('buttonFile').style.visibility = "hidden";
        document.getElementById('uploader').style.visibility = "visible";
        var percentage=(snapshot.bytesTransferred/snapshot.totalBytes)*100;
        uploader.value=percentage.toString();
      },
      function error(){
        document.getElementById('buttonFile').style.visibility = "visible";
        document.getElementById('uploader').style.visibility = "hidden";
        uploader.value='0';
      },
      ()=>{
        uploader.value='0';
        document.getElementById('buttonFile').style.visibility = "visible";
        document.getElementById('uploader').style.visibility = "hidden";
        this.draftImage=task.snapshot.downloadURL;
        this.addMessage();
      }
    );
  }

}

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
  <div style="float:right;width:100px;text-align:center">
  <div style="font-size:12px;position:fixed;color:blue;cursor:pointer;background-color:#eff5ff;padding:5px" (click)="router.navigate(['wallet',UI.currentTeam])">C{{DB.getTeamBalance(UI.currentTeam)|number:'1.2-2'}} ></div>
  </div>
  <div>
  <div style="color:blue; padding:10px 0 10px 0; cursor:pointer; text-align:center" (click)="messageNumberDisplay=messageNumberDisplay+15;this.teamMessages = this.db.list('teamMessages/'+this.UI.currentTeam,{query: {limitToLast: messageNumberDisplay}});">More messages</div>
  <ul style="list-style: none;">
    <li *ngFor="let message of teamMessages | async;let first=first;let last=last"
      (click)="timestampChatVisit()"
      style="cursor:pointer">
      <div class="newDay" *ngIf="isMessageNewTimeGroup(message.timestamp)||first">{{message.timestamp|date:'yMMMMEEEEd'}}</div>
      <div *ngIf="isMessageNewUserGroup(message.user,message.timestamp)||first" style="width:100%;height:10px"></div>
      <div style="margin:0 10px 0 7px;border-width:0 0 0 3px;border-style:solid" [style.border-color]="lastChatVisitTimestamp<message.timestamp?'red':'white'" [style.background-color]="message.action=='confirmation'||message.action=='add'?'#e6efe6':message.action=='warning'||message.action=='remove'?'#efeac6':''">
      <div style="float:left;width:60px;min-height:10px">
        <img (error)="errorHandler($event)" *ngIf="isMessageNewUserGroup(message.user,message.timestamp)||first" [src]="DB.getUserPhotoURL(message.user)" style="cursor:pointer;display:inline;float:left;margin: 5px 10px 10px 10px; border-radius:3px; object-fit: cover; height:35px; width:35px" (click)="router.navigate(['user',message.user])">
      </div>
      <div>
        <div *ngIf="isMessageNewUserGroup(message.user,message.timestamp)||first" style="font-weight:bold;display:inline;float:left;margin-right:10px">{{DB.getUserFirstName(message.user)}}</div>
        <div *ngIf="isMessageNewUserGroup(message.user,message.timestamp)||first" style="color: #AAA;">{{message.timestamp | date:'jm'}}</div>
        <img *ngIf="message.action=='transaction'" src="./../assets/App icons/icon_share_03.svg" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
        <img *ngIf="message.action=='confirmation'" src="./../assets/App icons/tick.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
        <img *ngIf="message.action=='warning'" src="./../assets/App icons/warning.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
        <img *ngIf="message.action=='process'" src="./../assets/App icons/process.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
        <img *ngIf="message.action=='add'" src="./../assets/App icons/add.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
        <img *ngIf="message.action=='remove'" src="./../assets/App icons/remove.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
        <div *ngIf="!message.image" style="float:left;color:#404040;padding:5px" [innerHTML]="message.text | linky"></div>
        <div *ngIf="message.linkTeam" style="float:left;cursor:pointer;margin: 0 5px 10px 50px" (click)="router.navigate(['chat',message.linkTeam])">
          <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(message.linkTeam)" style="float:left;object-fit:cover;height:25px;width:40px;border-radius:3px">
          <div style="font-size:11px;padding:5px;">{{DB.getTeamName(message.linkTeam)}}</div>
        </div>
        <div *ngIf="message.linkUser" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['user',message.linkUser])">
          <img (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(message.linkUser)" style="float:left;object-fit:cover;height:25px;width:25px">
          <div style="font-size:11px;padding:5px;">{{DB.getUserFirstName(message.linkUser)}} {{DB.getUserLastName(message.linkUser)}}</div>
        </div>
        <div *ngIf="message.process!==undefined" style="float:left;background-color:#c7edcd;border-radius:5px;padding:3px;margin:5px">
          <div *ngIf="message.process.result!==undefined" style="font-size:11px;line-height:normal">{{message.process.result}}</div>
        </div>
        <img class="imageWithZoom" *ngIf="message.image" [src]="message.image" style="clear:left;width:100%;max-height:350px;object-fit:contain;padding: 0 0 10px 0" (click)="showFullScreenImage(message.image)">
      </div>
      </div>
      {{storeMessageValues(message.user,message.timestamp)}}
      {{last?scrollToBottom(message.timestamp):''}}
    </li>
  </ul>
  <div style="height:125px;width:100%"></div>
  </div>
  </div>
  <div class="sheet" style="position: fixed;bottom: 0;width:100%;box-shadow:none">
    <ul style="list-style:none;float:left;">
      <li *ngFor="let user of draftMessageUsers | async">
      <div [hidden]="!user.draftMessage||user.$key==UI.currentUser" *ngIf="isDraftMessageRecent(user.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{DB.getUserFirstName(user.$key)}}...</div>
      </li>
    </ul>
    <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
    <label class="buttonUploadImage" *ngIf='DB.getTeamLeader(UI.currentTeam,UI.currentUser)||DB.getTeamMember(UI.currentTeam,UI.currentUser)' for="chatImage" id="buttonFile" style="float:right;padding:5px 35px 5px 0px;">
    <img src="./../assets/App icons/camera.png" style="width:25px">
    <span class="tipText">Max 3.0Mb</span>
    </label>
    <img *ngIf="!UI.serviceMessage&&DB.getTeamLeader(UI.currentTeam,UI.currentUser)" src="./../assets/App icons/process.png" style="cursor:pointer;width:25px;float:right;margin:5px 20px 5px 10px" (click)="this.router.navigate(['help'])">
    <div *ngIf="UI.serviceMessage" style="cursor:pointer;float:right;color:#76a6f2;padding:5px;margin:0 15px 5px 5px;border-radius:15px 15px 0 15px;border-style:solid;border-width:1px;border-color:#5b90e5"(click)="UI.clearProcessData()">{{UI.serviceMessage}}</div>
    <textarea [hidden]='!(DB.getTeamLeader(UI.currentTeam,UI.currentUser)||DB.getTeamMember(UI.currentTeam,UI.currentUser))' class="textAreaChat" maxlength="500" (keyup.enter)="addMessage()" (keyup)="updateDraftMessageDB()" [(ngModel)]="draftMessage" placeholder="Message team"></textarea>
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
  previousMessageUser: string;

  constructor(public sanitizer: DomSanitizer, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.UI.refreshServiceMessage();
      this.previousMessageTimestamp=0;
      this.previousMessageUser="";
      this.draftMessageDB=false;
      this.draftImage="";
      this.draftMessage="";
      this.messageNumberDisplay = 15;
      this.teamMessages = this.db.list('teamMessages/'+this.UI.currentTeam, {query: {
        orderByChild:'timestamp',
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

  isMessageNewTimeGroup (messageTimestamp) {
    var isMessageNewTimeGroup: boolean;
    isMessageNewTimeGroup= Math.abs(messageTimestamp-this.previousMessageTimestamp)>1000*60*60*4;
    return isMessageNewTimeGroup;
  }

  isMessageNewUserGroup (user,messageTimestamp) {
    var isMessageNewUserGroup: boolean;
    isMessageNewUserGroup= Math.abs(messageTimestamp-this.previousMessageTimestamp)>1000*60*5||(user!=this.previousMessageUser);
    return isMessageNewUserGroup;
  }

  storeMessageValues (user,timestamp) {
    this.previousMessageTimestamp=timestamp;
    this.previousMessageUser=user;
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
      following:true,
    });
  }

  addMessage() {
    this.draftMessage = this.draftMessage.replace(/(\r\n|\n|\r)/gm,"");
    if (this.draftMessage!=""||this.draftImage!="") {
      this.UI.processNewMessage(this.draftMessage).then(isProcessReady=>{
        firebase.database().ref('teamServices/'+this.UI.currentTeam+'/process').once('value',process=>{
          var processData=isProcessReady?process.val():null;
          const now = Date.now();
          var messageID=firebase.database().ref('teamMessages/'+this.UI.currentTeam).push({
            timestamp:now,
            text:this.draftMessage,
            image:this.draftImage,
            user:this.UI.currentUser,
            action:"chat",
            process:processData,
          }).key;
          if (isProcessReady) {
            this.db.object('teamServices/'+this.UI.currentTeam+'/process').update({
              messageID:messageID,
            });
          }
          this.db.object('teamActivities/'+this.UI.currentTeam).update({
            lastMessageTimestamp:now,
            lastMessageText:this.draftMessage,
            lastMessageUser:this.UI.currentUser,
          });
          this.timestampChatVisit();
          this.draftMessage = "";
          this.draftImage = "";
        });
      });
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
        this.draftMessage=task.snapshot.downloadURL;
        this.draftImage=task.snapshot.downloadURL;
        this.addMessage();
      }
    );
  }

}

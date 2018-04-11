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
  <div class="sheet" style="background-color:#f5f5f5">
  <div class="chat" id="chat-scroll">
  <div style="float:right;width:105px;text-align:center">
  <div style="font-size:12px;position:fixed;color:blue;cursor:pointer;background-color:#eff5ff;padding:5px" (click)="router.navigate(['wallet',UI.currentTeam])">C{{DB.getTeamBalance(UI.currentTeam)|number:'1.2-2'}} ></div>
  </div>
  <div>
  <div style="color:blue; padding:10px 0 10px 0; cursor:pointer; text-align:center" (click)="messageNumberDisplay=messageNumberDisplay+15;this.teamMessages = this.db.list('teamMessages/'+this.UI.currentTeam,{query: {limitToLast: messageNumberDisplay}});">More messages</div>
  <ul style="list-style: none;">
    <li *ngFor="let message of teamMessages | async;let first=first;let last=last">
      <div *ngIf="isMessageNewTimeGroup(message.timestamp)||first" style="padding:25px 15px 15px 15px">
        <div style="color:#777;background-color:#e9e8f9;width:200px;padding:5px;margin:0 auto;text-align:center;border-radius:10px">{{message.timestamp|date:'yMMMMEEEEd'}}</div>
      </div>
      <div style="box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08);cursor:pointer;border-width:0 0 0 3px;border-style:solid;border-radius:7px;background-color:white" [style.margin]="isMessageNewUserGroup(message.user,message.timestamp)||first?'15px 10px 5px 10px':'2px 10px 5px 70px'"
      [style.border-color]="lastChatVisitTimestamp<message.timestamp?'red':'white'" (click)="timestampChatVisit()">
        <div *ngIf="isMessageNewUserGroup(message.user,message.timestamp)||first" style="float:left;width:60px;min-height:10px">
          <img [src]="message?.imageUrlThumbUser" style="cursor:pointer;display:inline;float:left;margin: 5px 10px 10px 10px; border-radius:3px; object-fit: cover; height:35px; width:35px" (click)="router.navigate(['user',message.user])">
          {{image?.imageUrlThumbUser}}
        </div>
        <div>
          <div *ngIf="isMessageNewUserGroup(message.user,message.timestamp)||first" style="font-weight:bold;display:inline;float:left;margin-right:10px">{{message.firstName}}</div>
          <div *ngIf="isMessageNewUserGroup(message.user,message.timestamp)||first" style="color:#AAA;font-size:11px">{{message.timestamp | date:'HH:mm'}}</div>
          <img *ngIf="message.action=='transaction'" src="./../assets/App icons/icon_share_03.svg" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
          <img *ngIf="message.action=='confirmation'" src="./../assets/App icons/tick.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
          <img *ngIf="message.action=='warning'" src="./../assets/App icons/warning.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
          <img *ngIf="message.action=='process'" src="./../assets/App icons/process.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
          <img *ngIf="message.action=='add'" src="./../assets/App icons/add.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
          <img *ngIf="message.action=='remove'" src="./../assets/App icons/remove.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
          <div *ngIf="!message.image" style="float:left;color:#404040;margin:5px 5px 0 5px" [innerHTML]="message.text | linky"></div>
          <div *ngIf="message.linkTeam" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['chat',message.linkTeam])">
            <img [src]="message?.linkTeamImageUrlThumb" style="float:left;object-fit:cover;height:25px;width:40px;border-radius:3px">
            <div style="font-size:11px;padding:5px;">{{message?.linkTeamName}}</div>
          </div>
          <div *ngIf="message.linkUser" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['user',message.linkUser])">
            <img [src]="message?.linkUserImageUrlThumb" style="float:left;object-fit:cover;height:25px;width:25px">
            <div style="font-size:11px;padding:5px;">{{message?.linkUserFirstName}} {{message?.linkUserLastName}}</div>
          </div>
          <div *ngIf="message.process!==undefined" style="float:left;background-color:#c7edcd;border-radius:5px;padding:3px;margin:5px">
            <div *ngIf="message.process.result!==undefined" style="font-size:11px;line-height:normal">{{message.process.result}}</div>
          </div>
          <div style="clear:both;text-align:center">
            <img class="imageWithZoom" *ngIf="message.image" [src]="message.imageDownloadURL" style="clear:both;width:95%;max-height:320px;object-fit:contain;margin:5px 10px 5px 5px;border-radius:3px" (click)="showFullScreenImage(message.imageDownloadURL)">
          </div>
          <div *ngIf="showAll">
            <div style="clear:both;float:left;border-radius:7px;border-style:solid;border-width:1px;border-color:#aaa;padding:10px;margin:5px">
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#888">CHAIN</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Index: #{{message?.PERRINN?.chain?.index}}</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Previous: {{message?.PERRINN?.chain?.previousMessage}}</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Current: {{message?.$key}}</div>
            </div>
            <div style="float:left;border-radius:7px;border-style:solid;border-width:1px;border-color:#aaa;padding:10px;margin:5px">
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#888">MESSAGING COST</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Amount: C{{message?.PERRINN?.messagingCost?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Receiver: {{message?.PERRINN?.messagingCost?.receiver}}</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Reference: {{message?.PERRINN?.messagingCost?.reference}}</div>
            </div>
            <div style="float:left;border-radius:7px;border-style:solid;border-width:1px;border-color:#aaa;padding:10px;margin:5px">
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#888">WALLET</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Balance: C{{message?.PERRINN?.wallet?.balance|number:'1.2-20'}}</div>
            </div>
            <div style="float:left;border-radius:7px;border-style:solid;border-width:1px;border-color:#aaa;padding:10px;margin:5px">
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#888">TRANSACTION</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Amount: C{{message?.PERRINN?.transaction?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Receiver: {{message?.PERRINN?.transaction?.receiver}}</div>
              <div style="font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">Reference: {{message?.PERRINN?.transaction?.reference}}</div>
            </div>
          </div>
          <div style="clear:both;height:15px" (click)="showAll=!showAll">
            <img *ngIf="message?.PERRINN?.dataWrite=='complete'" src="./../assets/App icons/tick.png" style="float:right;height:15px;margin:0 2px 2px 0">
            <div style="float:right;font-size:10px;height:15px;margin:0 5px 2px 0;line-height:15px;color:#bbb">{{message?.PERRINN?.dataWrite!='complete'?message?.PERRINN?.dataWrite:''}}</div>
          </div>
        </div>
      </div>
      {{storeMessageValues(message.user,message.timestamp)}}
      {{last?scrollToBottom(message.timestamp):''}}
    </li>
  </ul>
  <div style="height:125px;width:100%"></div>
  </div>
  </div>
  <div class="sheet" style="position: fixed;bottom: 0;width:100%;box-shadow:none;background-color:#ededed">
    <ul style="list-style:none;float:left;">
      <li *ngFor="let user of draftMessageUsers | async">
      <div [hidden]="!user.draftMessage||user.$key==UI.currentUser" *ngIf="isDraftMessageRecent(user.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{user.firstName}}...</div>
      </li>
    </ul>
    <div *ngIf="isCurrentUserLeader||isCurrentUserMember">
      <img *ngIf="!UI.serviceMessage" src="./../assets/App icons/process.png" style="cursor:pointer;width:25px;float:right;margin:5px 20px 5px 10px" (click)="this.router.navigate(['help'])">
      <div *ngIf="UI.serviceMessage" style="box-shadow: 0 0 2px rgba(0, 0, 0, 0.1);cursor:pointer;border-radius:7px 7px 0 7px;background-color:white;float:right;color:#192368;padding:3px;margin:5px"(click)="UI.clearProcessData();UI.refreshServiceMessage()">{{UI.serviceMessage}}</div>
      <div style="clear:both;float:left;width:90%">
        <textarea id="inputMessage" style="float:left;width:95%;border-style:none;padding:9px;margin:10px;border-radius:3px;resize:none;overflow-y:scroll" maxlength="500" (keyup.enter)="addMessage()" (keyup)="updateDraftMessageDB()" [(ngModel)]="draftMessage" placeholder="Message team"></textarea>
      </div>
      <div style="float:right;width:10%">
        <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
        <label class="buttonUploadImage" for="chatImage" id="buttonFile">
        <img src="./../assets/App icons/camera.png" style="width:25px;margin:20px 5px 5px 5px">
        </label>
      </div>
    </div>
  </div>
  </div>
    `,
})
export class ChatComponent {
  draftMessage: string;
  draftImage: string;
  draftImageDownloadURL: string;
  draftMessageDB: boolean;
  draftMessageUsers: FirebaseListObservable<any>;
  teamMessages: FirebaseListObservable<any>;
  messageNumberDisplay: number;
  lastChatVisitTimestamp: number;
  scrollMessageTimestamp: number;
  previousMessageTimestamp: number;
  previousMessageUser: string;
  isCurrentUserLeader:boolean;
  isCurrentUserMember:boolean;
  showAll:boolean;

  constructor(public sanitizer: DomSanitizer, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.showAll=false;
      this.isCurrentUserLeader=false;
      this.isCurrentUserMember=false;
      db.object('PERRINNTeams/'+this.UI.currentTeam).subscribe(snapshot=>{
        this.UI.currentTeamObj=snapshot;
        if(this.UI.currentUser){
          if(this.UI.currentTeamObj.leaders!=undefined){
            this.isCurrentUserLeader=this.UI.currentTeamObj.leaders[UI.currentUser]?true:false;
          }
          if(this.UI.currentTeamObj.members!=undefined){
            this.isCurrentUserMember=this.UI.currentTeamObj.members[UI.currentUser]?true:false;
          }
        }
      });
      this.UI.refreshServiceMessage();
      this.previousMessageTimestamp=0;
      this.previousMessageUser="";
      this.draftMessageDB=false;
      this.draftImage="";
      this.draftImageDownloadURL="";
      this.draftMessage="";
      this.messageNumberDisplay = 15;
      this.teamMessages = this.db.list('teamMessages/'+this.UI.currentTeam, {query: {
        orderByChild:'timestamp',
        limitToLast:this.messageNumberDisplay,
      }});
      this.draftMessageUsers = this.db.list('teamActivities/'+this.UI.currentTeam+'/draftMessages/');
      this.db.object('viewUserTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).subscribe(userTeam=>{
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
    this.previousMessageUser=user;
    this.previousMessageTimestamp=timestamp;
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
    this.db.object('viewUserTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).update({
      lastChatVisitTimestamp:now,
      lastChatVisitTimestampNegative:-1*now,
      name:this.UI.currentTeamObj.name,
      imageUrlThumb:this.UI.currentTeamObj.imageUrlThumb?this.UI.currentTeamObj.imageUrlThumb:'',
    });
    this.db.object('subscribeTeamUsers/'+this.UI.currentTeam).update({
      [this.UI.currentUser]:true,
    });
  }

  addMessage() {
    this.draftMessage = this.draftMessage.replace(/(\r\n|\n|\r)/gm,"");
    if (this.draftMessage!=""||this.draftImage!="") {
      var isProcessReady=this.UI.processNewMessage(this.draftMessage);
      var processObject=isProcessReady?this.UI.serviceProcess[this.UI.currentTeam]:null;
      const now = Date.now();
      var messageID=firebase.database().ref('teamMessages/'+this.UI.currentTeam).push({
        timestamp:now,
        text:this.draftMessage,
        image:this.draftImage,
        imageDownloadURL:this.draftImageDownloadURL,
        user:this.UI.currentUser,
        firstName:this.UI.currentUserObj.firstName,
        imageUrlThumbUser:this.UI.currentUserObj.imageUrlThumb?this.UI.currentUserObj.imageUrlThumb:'',
        action:"chat",
        process:processObject,
      }).key;
      if (isProcessReady) {
        this.UI.serviceProcess[this.UI.currentTeam].messageID=messageID;
        this.UI.refreshServiceMessage();
      }
      this.timestampChatVisit();
      this.draftMessage = "";
      this.draftImage = "";
    }
  }

  updateDraftMessageDB () {
    if ((this.draftMessage!="")!=this.draftMessageDB) {
      this.db.object('teamActivities/'+this.UI.currentTeam+'/draftMessages/'+this.UI.currentUser).update({
        firstName:this.UI.currentUserObj.firstName,
        draftMessage:this.draftMessage!="",
        draftMessageTimestamp:firebase.database.ServerValue.TIMESTAMP,
      });
    }
    this.draftMessageDB=(this.draftMessage!="");
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
        this.draftMessage=task.snapshot.ref.name.substring(0,13);
        this.draftImage=task.snapshot.ref.name.substring(0,13);
        this.draftImageDownloadURL=task.snapshot.downloadURL;
        this.addMessage();
        event.target.value = '';
      }
    );
  }

}

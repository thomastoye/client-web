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
  <div>
  <div style="color:blue; padding:10px 0 10px 0; cursor:pointer; text-align:center" (click)="messageNumberDisplay=messageNumberDisplay+15;this.teamMessages = this.db.list('teamMessages/'+this.UI.currentTeam,{query: {limitToLast: messageNumberDisplay}});">More messages</div>
  <ul style="list-style: none;">
    <li *ngFor="let message of teamMessages | async;let first=first;let last=last">
      <div *ngIf="isMessageNewTimeGroup(message.timestamp)||first" style="padding:25px 15px 15px 15px">
        <div style="box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08);color:#404040;background-color:#e9e8f9;width:200px;padding:5px;margin:0 auto;text-align:center;border-radius:10px">{{message.timestamp|date:'yMMMMEEEEd'}}</div>
      </div>
      <div style="box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08);cursor:pointer;border-width:0 0 0 3px;border-style:solid;border-radius:7px;background-color:white" [style.margin]="isMessageNewUserGroup(message.user,message.timestamp)||first?'15px 10px 5px 10px':'2px 10px 5px 70px'"
      [style.border-color]="lastChatVisitTimestamp<message.timestamp?'red':'white'" (click)="UI.timestampChatVisit()">
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
          <img *ngIf="message.action=='process'" src="./../assets/App icons/repeat.png" style="display:inline;float:left;margin: 0 5px 0 5px;height:20px;">
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
          <div *ngIf="message?.PERRINN?.process?.inputsComplete" style="clear:both;margin:5px">
            <img src="./../assets/App icons/repeat.png" style="display:inline;float:left;height:30px">
            <div style="float:left;background-color:#c7edcd;padding:5px">
              <span style="font-size:11px">{{message?.PERRINN?.process?.regex}}</span>
              <span style="font-size:11px">{{message?.PERRINN?.process?.inputs|json}}:</span>
              <span style="font-size:11px">{{message?.PERRINN?.process?.result}}</span>
            </div>
          </div>
          <div *ngIf="message?.PERRINN?.transactionOut?.processed" style="clear:both;margin:5px">
            <img src="./../assets/App icons/out.png" style="display:inline;float:left;height:30px">
            <div style="float:left;background-color:#c7edcd;padding:5px">
              <span style="font-size:11px">C{{message?.PERRINN?.transactionOut?.amount|number:'1.2-20'}}</span>
              <span style="font-size:11px">have been sent to</span>
              <span style="font-size:11px">{{message?.PERRINN?.transactionOut?.receiverName}}</span>
              <span style="font-size:11px">reference: {{message?.PERRINN?.transactionOut?.reference}}</span>
            </div>
            <img [src]="message?.PERRINN?.transactionOut?.receiverImageUrlThumb" style="object-fit:cover;height:30px;width:50px" (click)="router.navigate(['chat',message?.PERRINN?.transactionOut?.receiver])">
          </div>
          <div *ngIf="message?.PERRINN?.transactionIn?.processed" style="clear:both;margin:5px">
            <img src="./../assets/App icons/in.png" style="display:inline;float:left;height:30px">
            <div style="float:left;background-color:#c7edcd;padding:5px">
              <span style="font-size:11px">C{{message?.PERRINN?.transactionIn?.amount|number:'1.2-20'}}</span>
              <span style="font-size:11px">have been received from</span>
              <span style="font-size:11px">{{message?.PERRINN?.transactionIn?.donorName}}</span>
              <span style="font-size:11px">reference: {{message?.PERRINN?.transactionIn?.reference}}</span>
            </div>
            <img [src]="message?.PERRINN?.transactionIn?.donorImageUrlThumb" style="object-fit:cover;height:30px;width:50px" (click)="router.navigate(['chat',message?.PERRINN?.transactionIn?.donor])">
          </div>
          <div style="clear:both;text-align:center">
            <img class="imageWithZoom" *ngIf="message.image" [src]="message.imageDownloadURL" style="clear:both;width:70%;max-height:320px;object-fit:contain;margin:5px 10px 5px 5px;border-radius:3px" (click)="showFullScreenImage(message.imageDownloadURL)">
          </div>
          <div *ngIf="showDetails[message.$key]">
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/messaging.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">MESSAGE COST</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message?.PERRINN?.messagingCost?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Receiver: {{message?.PERRINN?.messagingCost?.receiver}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message?.PERRINN?.messagingCost?.status=='rejected balance low'?'#fcebb8':''">Status: {{message?.PERRINN?.messagingCost?.status}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message?.PERRINN?.messagingCost?.processed?'#c7edcd':''">Processed: {{message?.PERRINN?.messagingCost?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message?.PERRINN?.messagingCost?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/repeat.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">PROCESS</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Regex: {{message?.PERRINN?.process?.regex}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Function: {{message?.PERRINN?.process?.function|json}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Inputs complete: {{message?.PERRINN?.process?.inputsComplete}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Inputs: {{message?.PERRINN?.process?.inputs|json}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Result: {{message?.PERRINN?.process?.result}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message?.PERRINN?.process?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/out.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">TRANSACTION OUT</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message?.PERRINN?.transactionOut?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Receiver: {{message?.PERRINN?.transactionOut?.receiver}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Message: {{message?.PERRINN?.transactionOut?.receiverMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Reference: {{message?.PERRINN?.transactionOut?.reference}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message?.PERRINN?.transactionOut?.status=='rejected balance low'?'#fcebb8':''">Status: {{message?.PERRINN?.transactionOut?.status}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message?.PERRINN?.transactionOut?.processed?'#c7edcd':''">Processed: {{message?.PERRINN?.transactionOut?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message?.PERRINN?.transactionOut?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/in.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">TRANSACTION IN</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message?.PERRINN?.transactionIn?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Donor: {{message?.PERRINN?.transactionIn?.donor}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Message: {{message?.PERRINN?.transactionIn?.donorMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Reference: {{message?.PERRINN?.transactionIn?.reference}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message?.PERRINN?.transactionIn?.processed?'#c7edcd':''">Processed: {{message?.PERRINN?.transactionIn?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message?.PERRINN?.transactionIn?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/chain.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">MESSAGE CHAIN</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Index: #{{message?.PERRINN?.chain?.index}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message?.PERRINN?.chain?.previousMessage!=undefined?'#c7edcd':''">Previous: {{message?.PERRINN?.chain?.previousMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Current: {{message?.$key}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Next: {{message?.PERRINN?.chain?.nextMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message?.PERRINN?.chain?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/wallet.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">WALLET</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Previous balance: C{{message?.PERRINN?.wallet?.previousBalance|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount: C{{message?.PERRINN?.wallet?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message?.PERRINN?.wallet?.balance!=undefined?'#c7edcd':''">Balance: C{{message?.PERRINN?.wallet?.balance|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp: {{message?.PERRINN?.wallet?.timestamp}}</div>
            </div>
          </div>
        </div>
        <div class='messageFooter' style="clear:both;height:15px" (click)="switchShowDetails(message.$key)">
          <div style="float:left;text-align:right;line-height:10px">...</div>
          <img *ngIf="message?.PERRINN?.dataWrite=='complete'" src="./../assets/App icons/tick.png" style="float:right;height:15px;margin:0 2px 2px 0">
          <div style="float:right;font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">{{message?.PERRINN?.dataWrite!='complete'?message?.PERRINN?.dataWrite:''}}</div>
          <div *ngIf="message?.PERRINN?.chain?.nextMessage=='none'&&message?.PERRINN?.wallet?.balance!=undefined" style="float:right;font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">C{{message?.PERRINN?.wallet?.balance|number:'1.2-20'}}</div>
        </div>
      </div>
      {{storeMessageValues(message.user,message.timestamp)}}
      {{last?scrollToBottom(message.timestamp):''}}
    </li>
  </ul>
  <div style="height:125px;width:100%"></div>
  </div>
  <div class="sheet" style="position: fixed;bottom: 0;width:100%;box-shadow:none;background-color:#ededed">
    <div *ngIf="!isCurrentUserLeader&&!isCurrentUserMember">
      <ul style="list-style:none;float:left;">
        <li *ngFor="let user of draftMessageUsers | async">
        <div [hidden]="!user.draftMessage||user.$key==UI.currentUser" *ngIf="isDraftMessageRecent(user.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{user.firstName}}...</div>
        </li>
      </ul>
    </div>
    <div *ngIf="isCurrentUserLeader||isCurrentUserMember">
      <ul style="list-style:none;float:left;">
        <li *ngFor="let user of draftMessageUsers | async">
        <div [hidden]="!user.draftMessage||user.$key==UI.currentUser" *ngIf="isDraftMessageRecent(user.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{user.firstName}}...</div>
        </li>
      </ul>
      <div *ngIf="UI.process[UI.currentTeam]?.service" style="box-shadow: 0 2px 2px 0 rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08);cursor:pointer;border-radius:7px;background-color:white;float:left;padding:5px;margin:10px;width:70%"(click)="UI.clearProcessData()">
        <div style="float:left;font-size:11px;font-weight:bold">{{UI.process[UI.currentTeam]?.regex}}:</div>
        <img src="./../assets/App icons/remove.png" style="float:right;height:20px;">
        <ul style="clear:both;list-style:none;color:green;margin:10px 0 10px 0">
          <li *ngFor="let input of UI.process[UI.currentTeam]?.inputsArray">
            <div style="float:left;font-size:11px;line-height:11px">{{input[0]}}: {{input[1]}}</div>
          </li>
        </ul>
        <div style="color:blue">{{UI.process[UI.currentTeam]?.message}}</div>
      </div>
      <img src="./../assets/App icons/repeat.png" style="cursor:pointer;width:25px;float:right;margin:5px 20px 5px 10px" (click)="this.router.navigate(['help'])">
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
  showDetails:{};

  constructor(public sanitizer: DomSanitizer, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.isCurrentUserLeader=false;
      this.isCurrentUserMember=false;
      this.showDetails={};
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

  switchShowDetails(message){
    if(this.showDetails[message]==undefined){
      this.showDetails[message]=true;
    } else {
      this.showDetails[message]=!this.showDetails[message];
    }
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

  addMessage() {
    this.UI.createMessage(this.draftMessage,this.draftImage,this.draftImageDownloadURL,'','');
    this.draftMessage="";
    this.draftImage="";
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

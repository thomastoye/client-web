import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import '@firebase/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'chat',
  template: `
  <div id='main_container' scrollable (scrollPosition)="scrollHandler($event)">
  <div class="sheet" style="box-shadow:none;background-color:#eaeaea">
  <div class="spinner" *ngIf="UI.loading">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
  <div>
  <ul style="list-style:none;">
    <li *ngFor="let message of teamMessages|async;let first=first;let last=last;let i=index">
      <div *ngIf="i<messageNumberDisplay" style="cursor:pointer" [style.background-color]="lastChatVisitTimestamp<message.values?.payload?.timestamp?'#ffefd1':''" (click)="UI.timestampChatVisit()">
      <div *ngIf="isMessageNewTimeGroup(message.values?.payload?.timestamp)||first" style="padding:25px 15px 15px 15px">
        <div style="box-shadow:0 0 2px 0 rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.08);color:#404040;background-color:#e9e8f9;width:200px;padding:5px;margin:0 auto;text-align:center;border-radius:10px">{{message.values?.payload?.timestamp|date:'fullDate'}}</div>
      </div>
      <div *ngIf="isMessageNewUserGroup(message.values?.payload?.user,message.values?.payload?.timestamp)||first" style="clear:both;width:100%;height:15px"></div>
      <div *ngIf="isMessageNewUserGroup(message.values?.payload?.user,message.values?.payload?.timestamp)||first" style="float:left;width:60px;min-height:10px">
        <img [src]="message.values?.payload?.imageUrlThumbUser" style="cursor:pointer;display:inline;float:left;margin:10px;border-radius:3px; object-fit:cover; height:35px; width:35px" (click)="router.navigate(['user',message.values?.payload?.user])">
      </div>
      <div style="box-shadow:0 0 2px 0 rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.08);cursor:text;border-radius:7px;background-color:white;margin:2px 10px 5px 60px">
        <div>
          <div *ngIf="isMessageNewUserGroup(message.values?.payload?.user,message.values?.payload?.timestamp)||first" style="font-size:12px;font-weight:bold;display:inline;float:left;margin:0px 10px 0px 5px">{{message.values?.payload?.name}}{{message.values?.payload?.firstName}}</div>
          <div *ngIf="isMessageNewUserGroup(message.values?.payload?.user,message.values?.payload?.timestamp)||first" style="color:#AAA;font-size:11px">{{message.values?.payload?.timestamp | date:'HH:mm'}}</div>
          <img *ngIf="message.values?.payload?.action=='transaction'" src="./../assets/App icons/icon_share_03.svg" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.values?.payload?.action=='confirmation'" src="./../assets/App icons/tick.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.values?.payload?.action=='warning'" src="./../assets/App icons/warning.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.values?.payload?.action=='process'" src="./../assets/App icons/repeat.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.values?.payload?.action=='add'" src="./../assets/App icons/add.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <img *ngIf="message.values?.payload?.action=='remove'" src="./../assets/App icons/remove.png" style="display:inline;float:left;margin:0 5px 0 5px;height:20px;">
          <div *ngIf="!message.values?.payload?.image" style="float:left;color:#404040;margin:5px 5px 0 5px" [innerHTML]="message.values?.payload?.text | linky"></div>
          <div *ngIf="message.values?.payload?.linkTeam" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['chat',message.values?.payload?.linkTeam])">
            <img [src]="message.values?.payload?.linkTeamImageUrlThumb" style="float:left;object-fit:cover;height:25px;width:40px;border-radius:3px">
            <div style="font-size:11px;padding:5px;">{{message.values?.payload?.linkTeamName}}</div>
          </div>
          <div *ngIf="message.values?.payload?.linkUser" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['user',message.values?.payload?.linkUser])">
            <img [src]="message.values?.payload?.linkUserImageUrlThumb" style="float:left;object-fit:cover;height:25px;width:25px">
            <div style="font-size:11px;padding:5px;">{{message.values?.payload?.linkUserName}} {{message.values?.payload?.linkuserFamilyName}}</div>
          </div>
          <div *ngIf="message.values?.PERRINN?.process?.inputsComplete" style="clear:both;margin:5px">
            <img src="./../assets/App icons/repeat.png" style="display:inline;float:left;height:30px">
            <div style="float:left;background-color:#c7edcd;padding:5px">
              <span style="font-size:11px">{{message.values?.PERRINN?.process?.regex}}</span>
              <span style="font-size:11px">{{message.values?.PERRINN?.process?.inputs|json}}:</span>
              <span style="font-size:11px">{{message.values?.PERRINN?.process?.result}}</span>
            </div>
          </div>
          <div *ngIf="message.values?.PERRINN?.transactionOut?.processed" style="clear:both;margin:5px">
            <img src="./../assets/App icons/out.png" style="display:inline;float:left;height:30px">
            <div style="float:left;background-color:#c7edcd;padding:5px">
              <span style="font-size:11px">C{{message.values?.PERRINN?.transactionOut?.amount|number:'1.2-20'}}</span>
              <span style="font-size:11px">have been sent to</span>
              <span style="font-size:11px">{{message.values?.PERRINN?.transactionOut?.receiverName}}</span>
              <span style="font-size:11px">reference:{{message.values?.PERRINN?.transactionOut?.reference}}</span>
            </div>
            <img [src]="message.values?.PERRINN?.transactionOut?.receiverImageUrlThumb" style="object-fit:cover;height:30px;width:50px" (click)="router.navigate(['chat',message.values?.PERRINN?.transactionOut?.receiver])">
          </div>
          <div *ngIf="message.values?.PERRINN?.transactionIn?.processed" style="clear:both;margin:5px">
            <img src="./../assets/App icons/in.png" style="display:inline;float:left;height:30px">
            <div style="float:left;background-color:#c7edcd;padding:5px">
              <span style="font-size:11px">C{{message.values?.PERRINN?.transactionIn?.amount|number:'1.2-20'}}</span>
              <span style="font-size:11px">have been received from</span>
              <span style="font-size:11px">{{message.values?.PERRINN?.transactionIn?.donorName}}</span>
              <span style="font-size:11px">reference:{{message.values?.PERRINN?.transactionIn?.reference}}</span>
            </div>
            <img [src]="message.values?.PERRINN?.transactionIn?.donorImageUrlThumb" style="object-fit:cover;height:30px;width:50px" (click)="router.navigate(['chat',message.values?.PERRINN?.transactionIn?.donor])">
          </div>
          <div style="clear:both;text-align:center">
            <img class="imageWithZoom" *ngIf="message.values?.payload?.image" [src]="message.values?.payload?.imageDownloadURL" style="clear:both;width:70%;max-height:320px;object-fit:contain;margin:5px 10px 5px 5px;border-radius:3px" (click)="showFullScreenImage(message.values?.payload?.imageDownloadURL)">
          </div>
          <div *ngIf="showDetails[message.key]">
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/messaging.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">MESSAGE COST</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount:C{{message.values?.PERRINN?.messagingCost?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount Read:C{{message.values?.PERRINN?.messagingCost?.amountRead|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount Write:C{{message.values?.PERRINN?.messagingCost?.amountWrite|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Receiver:{{message.values?.PERRINN?.messagingCost?.receiver}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message.values?.PERRINN?.messagingCost?.status=='rejected balance low'?'#fcebb8':''">Status:{{message.values?.PERRINN?.messagingCost?.status}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message.values?.PERRINN?.messagingCost?.processed?'#c7edcd':''">Processed:{{message.values?.PERRINN?.messagingCost?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp:{{message.values?.PERRINN?.messagingCost?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/repeat.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">PROCESS</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Regex:{{message.values?.PERRINN?.process?.regex}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Function:{{message.values?.PERRINN?.process?.function|json}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Inputs complete:{{message.values?.PERRINN?.process?.inputsComplete}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Inputs:{{message.values?.PERRINN?.process?.inputs|json}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Result:{{message.values?.PERRINN?.process?.result}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp:{{message.values?.PERRINN?.process?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/out.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">TRANSACTION OUT</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount:C{{message.values?.PERRINN?.transactionOut?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Receiver:{{message.values?.PERRINN?.transactionOut?.receiver}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Message:{{message.values?.PERRINN?.transactionOut?.receiverMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Reference:{{message.values?.PERRINN?.transactionOut?.reference}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message.values?.PERRINN?.transactionOut?.status=='rejected balance low'?'#fcebb8':''">Status:{{message.values?.PERRINN?.transactionOut?.status}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message.values?.PERRINN?.transactionOut?.processed?'#c7edcd':''">Processed:{{message.values?.PERRINN?.transactionOut?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp:{{message.values?.PERRINN?.transactionOut?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/in.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">TRANSACTION IN</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount:C{{message.values?.PERRINN?.transactionIn?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Donor:{{message.values?.PERRINN?.transactionIn?.donor}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Message:{{message.values?.PERRINN?.transactionIn?.donorMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Reference:{{message.values?.PERRINN?.transactionIn?.reference}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message.values?.PERRINN?.transactionIn?.processed?'#c7edcd':''">Processed:{{message.values?.PERRINN?.transactionIn?.processed}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp:{{message.values?.PERRINN?.transactionIn?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/chain.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">MESSAGE CHAIN</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Index:#{{message.values?.PERRINN?.chain?.index}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message.values?.PERRINN?.chain?.previousMessage!=undefined?'#c7edcd':''">Previous:{{message.values?.PERRINN?.chain?.previousMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Current:{{message.values?.key}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Next:{{message.values?.PERRINN?.chain?.nextMessage}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp:{{message.values?.PERRINN?.chain?.timestamp}}</div>
            </div>
            <div style="float:left;border-radius:10px;border-style:solid;border-width:1px;border-color:#aaa;padding:5px;margin:5px;width:200px;height:175px">
              <img src="./../assets/App icons/wallet.png" style="display:inline;float:right;height:25px;border-radius:25%">
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040">WALLET</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Previous balance:C{{message.values?.PERRINN?.wallet?.previousBalance|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Amount:C{{message.values?.PERRINN?.wallet?.amount|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#404040;border-radius:5px" [style.background-color]="message.values?.PERRINN?.wallet?.balance!=undefined?'#c7edcd':''">Balance:C{{message.values?.PERRINN?.wallet?.balance|number:'1.2-20'}}</div>
              <div style="font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">Timestamp:{{message.values?.PERRINN?.wallet?.timestamp}}</div>
            </div>
          </div>
        </div>
        <div class='messageFooter' style="cursor:pointer;clear:both;height:15px" (click)="switchShowDetails(message.key)">
          <div style="float:left;width:100px;text-align:right;line-height:10px">...</div>
          <img *ngIf="message.values?.PERRINN?.dataWrite=='complete'" src="./../assets/App icons/tick.png" style="float:right;height:15px;margin:0 2px 2px 0">
          <div style="float:right;font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">{{message.values?.PERRINN?.dataWrite!='complete'?message.values?.PERRINN?.dataWrite:''}}</div>
          <div *ngIf="message.values?.PERRINN?.chain?.nextMessage=='none'&&message.values?.PERRINN?.wallet?.balance!=undefined" style="float:right;font-size:10px;margin:0 5px 2px 0;line-height:15px;color:#999">C{{message.values?.PERRINN?.wallet?.balance|number:'1.2-20'}}</div>
        </div>
      </div>
      </div>
      {{storeMessageValues(message.values?.payload?.user,message.values?.payload?.timestamp)}}
      {{(last||i==(messageNumberDisplay-1))?scrollToBottom(message.values?.payload?.timestamp):''}}
    </li>
  </ul>
  <div style="height:125px;width:100%"></div>
  </div>
  <div class="sheet" style="position:fixed;bottom:0;width:100%;box-shadow:none;background-color:#f2f2f2">
    <div *ngIf="!isCurrentUserLeader&&!isCurrentUserMember">
      <div *ngIf="chatReplayMode" style="float:left;color:green;margin:5px">chat replay</div>
      <div *ngIf="chatReplayDraftMessageUser" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{chatReplayDraftMessageUser}}...</div>
      <div *ngIf="!isCurrentUserFollowing(UI.currentTeam)" class="buttonDiv" style="clear:both;margin-bottom:25px" (click)="followTeam(UI.currentTeam, UI.currentUser)">Follow</div>
      <div *ngIf="isCurrentUserFollowing(UI.currentTeam)" class="buttonDiv" style="clear:both;margin-bottom:25px;color:green;cursor:default">Following</div>
      <ul style="list-style:none;float:left;">
        <li *ngFor="let user of draftMessageUsers | async">
        <div [hidden]="!user.values.draftMessage||user.key==UI.currentUser" *ngIf="isDraftMessageRecent(user.values.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{user.values.name}}...</div>
        </li>
      </ul>
    </div>
    <div *ngIf="isCurrentUserLeader||isCurrentUserMember">
      <div *ngIf="chatReplayMode" style="float:left;color:green;margin:5px">chat replay</div>
      <div *ngIf="chatReplayDraftMessageUser" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{chatReplayDraftMessageUser}}...</div>
      <ul style="list-style:none;float:left;">
        <li *ngFor="let user of draftMessageUsers | async">
        <div [hidden]="!user.values.draftMessage||user.key==UI.currentUser" *ngIf="isDraftMessageRecent(user.values.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{user.values.name}}...</div>
        </li>
      </ul>
      <div *ngIf="UI.process[UI.currentTeam]?.service" style="box-shadow:0 0 2px 0 rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.08);cursor:pointer;border-radius:7px;background-color:white;float:left;padding:5px;margin:10px;width:70%"(click)="UI.clearProcessData()">
        <div style="float:left;font-size:11px;font-weight:bold">{{UI.process[UI.currentTeam]?.regex}}:</div>
        <img src="./../assets/App icons/remove.png" style="float:right;height:20px;">
        <ul style="clear:both;list-style:none;color:green;margin:10px 0 10px 0">
          <li *ngFor="let input of UI.process[UI.currentTeam]?.inputsArray">
            <div style="float:left;font-size:11px;line-height:11px">{{input[0]}}:{{input[1]}}</div>
          </li>
        </ul>
        <div style="color:blue">{{UI.process[UI.currentTeam]?.message}}</div>
      </div>
      <img class='editButton' style="width:20px;float:right" (click)="this.router.navigate(['help'])" src="./../assets/App icons/settings.png">
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
  </div>
    `,
})
export class ChatComponent {
  draftMessage: string;
  draftImage: string;
  draftImageDownloadURL: string;
  draftMessageDB: boolean;
  draftMessageUsers: Observable<any[]>;
  teamMessages: Observable<any[]>;
  messageNumberDisplay: number;
  lastChatVisitTimestamp: number;
  scrollMessageTimestamp: number;
  previousMessageTimestamp: number;
  previousMessageUser: string;
  isCurrentUserLeader: boolean;
  isCurrentUserMember: boolean;
  showDetails: {};
  chatReplayMode: boolean;
  chatReplayDraftMessageUser: string;

  constructor(public sanitizer: DomSanitizer, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, private route: ActivatedRoute) {
    this.UI.loading = true;
    this.chatReplayMode = false;
    this.route.params.subscribe(params => {
      this.UI.currentTeam = params.id;
      this.isCurrentUserLeader = false;
      this.isCurrentUserMember = false;
      this.showDetails = {};
      db.object('PERRINNTeams/' + this.UI.currentTeam).valueChanges().subscribe(snapshot => {
        this.UI.currentTeamObj = snapshot;
        this.UI.currentTeamObjKey = this.UI.currentTeam;
        if (this.UI.currentUser) {
          if (this.UI.currentTeamObj.leaders != undefined) {
            this.isCurrentUserLeader = this.UI.currentTeamObj.leaders[UI.currentUser] ? true : false;
          }
          if (this.UI.currentTeamObj.members != undefined) {
            this.isCurrentUserMember = this.UI.currentTeamObj.members[UI.currentUser] ? true : false;
          }
        }
      });
      db.object('PERRINNTeams/' + this.UI.currentTeam + '/chatReplayMode').valueChanges().subscribe(snapshot => {
        if (snapshot != undefined) {
          this.chatReplayMode = snapshot ? true : false;
        }
        this.previousMessageTimestamp = 0;
        this.previousMessageUser = '';
        this.draftMessageDB = false;
        this.draftImage = '';
        this.draftImageDownloadURL = '';
        this.draftMessage = '';
        this.messageNumberDisplay = 15;
        this.teamMessages = this.db.list('teamMessages/' + this.UI.currentTeam, ref => ref.limitToLast(this.messageNumberDisplay)).snapshotChanges().pipe(map(changes => {
          this.UI.loading = false;
          const updateObj = {};
          changes.forEach(c => {
            updateObj['teamReads/' + this.UI.currentUser + '/' + this.UI.currentTeam + '/' + c.payload.key] = true;
          });
          firebase.database().ref().update(updateObj);
          return changes.map(c => ({key: c.payload.key, values: c.payload.val()}));
        }));
        if (this.chatReplayMode) {
          this.chatReplayLoop();
        }
        this.draftMessageUsers = this.db.list('teamActivities/' + this.UI.currentTeam + '/draftMessages/').snapshotChanges().pipe(map(changes => {
          return changes.map(c => ({key: c.payload.key, values: c.payload.val()}));
        }));
        this.db.object('viewUserTeams/' + this.UI.currentUser + '/' + this.UI.currentTeam).snapshotChanges().subscribe(userTeam => {
          if (userTeam.payload.val() != null) {this.lastChatVisitTimestamp = Number(userTeam.payload.val().lastChatVisitTimestamp); }
        });
      });
    });
  }

  ngOnDestroy() {
    this.chatReplayMode = false;
  }

  chatReplayLoop() {
    this.messageNumberDisplay = 0;
    const that = this;
    let textLength = 0;
    let image = 0;
    (function theLoop() {
      that.chatReplayDraftMessageUser = '';
      setTimeout(function() {
        ++that.messageNumberDisplay;
        that.teamMessages.subscribe(snapshot => {
          if (snapshot[that.messageNumberDisplay] == undefined) {that.chatReplayMode = false; }
          textLength = snapshot[that.messageNumberDisplay].values.payload.text.length;
          if (snapshot[that.messageNumberDisplay].values.payload.image) {image = 1; } else { image = 0; }
        });
        if (that.chatReplayMode) {theLoop(); }
      }, 2000 + textLength * 100 + image * 4000);
      setTimeout(function() {
        that.teamMessages.subscribe(snapshot => {
          that.chatReplayDraftMessageUser = snapshot[that.messageNumberDisplay].values.payload.name;
        });
      }, textLength * 100 + image * 4000);
    })();
  }

  scrollHandler(e) {
    if (e === 'top') {
      this.UI.loading = true;
      this.messageNumberDisplay += 15;
      return this.teamMessages = this.db.list('teamMessages/' + this.UI.currentTeam, ref => ref.limitToLast(this.messageNumberDisplay)).snapshotChanges().pipe(map(changes => {
        this.UI.loading = false;
        const updateObj = {};
        changes.forEach(c => {
          updateObj['teamReads/' + this.UI.currentUser + '/' + this.UI.currentTeam + '/' + c.payload.key] = true;
        });
        firebase.database().ref().update(updateObj);
        return changes.map(c => ({key: c.payload.key, values: c.payload.val()}));
      }));
    }
  }

  switchShowDetails(message) {
    if (this.showDetails[message] == undefined) {
      this.showDetails[message] = true;
    } else {
      this.showDetails[message] = !this.showDetails[message];
    }
  }

  showFullScreenImage(src) {
    const fullScreenImage = document.getElementById('fullScreenImage') as HTMLImageElement;
    fullScreenImage.src = src;
    fullScreenImage.style.visibility = 'visible';
  }

  isMessageNewTimeGroup(messageTimestamp) {
    let isMessageNewTimeGroup: boolean;
    isMessageNewTimeGroup = Math.abs(messageTimestamp - this.previousMessageTimestamp) > 1000 * 60 * 60 * 4;
    return isMessageNewTimeGroup;
  }

  isMessageNewUserGroup(user, messageTimestamp) {
    let isMessageNewUserGroup: boolean;
    isMessageNewUserGroup = Math.abs(messageTimestamp - this.previousMessageTimestamp) > 1000 * 60 * 5 || (user != this.previousMessageUser);
    return isMessageNewUserGroup;
  }

  storeMessageValues(user, timestamp) {
    this.previousMessageUser = user;
    this.previousMessageTimestamp = timestamp;
  }

  isDraftMessageRecent(draftMessageTimestamp) {
    return (Date.now() - draftMessageTimestamp) < 1000 * 60;
  }

  scrollToBottom(scrollMessageTimestamp: number) {
    if (scrollMessageTimestamp != this.scrollMessageTimestamp) {
      const element = document.getElementById('main_container');
      element.scrollTop = element.scrollHeight;
      this.scrollMessageTimestamp = scrollMessageTimestamp;
    }
  }

  addMessage() {
    this.UI.createMessage(this.draftMessage, this.draftImage, this.draftImageDownloadURL, '', '');
    this.draftMessage = '';
    this.draftImage = '';
  }

  followTeam(teamID: string, userID: string) {
    const now = Date.now();
    this.db.object('viewUserTeams/' + userID + '/' + teamID).update({
      lastChatVisitTimestamp: now,
      lastChatVisitTimestampNegative: -1 * now,
      name: this.UI.currentTeamObj.name,
      imageUrlThumb: this.UI.currentTeamObj.imageUrlThumb ? this.UI.currentTeamObj.imageUrlThumb : '',
    });
    this.db.object('subscribeTeamUsers/' + teamID).update({
      [userID]: true,
    });
  }

  updateDraftMessageDB() {
    if ((this.draftMessage != '') != this.draftMessageDB) {
      this.db.object('teamActivities/' + this.UI.currentTeam + '/draftMessages/' + this.UI.currentUser).update({
        name: this.UI.currentUserObj.name,
        draftMessage: this.draftMessage != '',
        draftMessageTimestamp: firebase.database.ServerValue.TIMESTAMP,
      });
    }
    this.draftMessageDB = (this.draftMessage != '');
  }

  isCurrentUserFollowing(team) {
    if (this.UI.currentUserTeamsObj == undefined) {return false; }
    if (this.UI.currentUserTeamsObj[team] == undefined) {return false; }
    return true;
  }

  onImageChange(event) {
    const image = event.target.files[0];
    const uploader = document.getElementById('uploader') as HTMLInputElement;
    const storageRef = firebase.storage().ref('images/' + Date.now() + image.name);
    const task = storageRef.put(image);
    task.on('state_changed',
      function progress(snapshot) {
        document.getElementById('buttonFile').style.visibility = 'hidden';
        document.getElementById('uploader').style.visibility = 'visible';
        const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        uploader.value = percentage.toString();
      },
      function error() {
        document.getElementById('buttonFile').style.visibility = 'visible';
        document.getElementById('uploader').style.visibility = 'hidden';
        uploader.value = '0';
      },
      () => {
        uploader.value = '0';
        document.getElementById('buttonFile').style.visibility = 'visible';
        document.getElementById('uploader').style.visibility = 'hidden';
        this.draftMessage = task.snapshot.ref.name.substring(0, 13);
        this.draftImage = task.snapshot.ref.name.substring(0, 13);
        storageRef.getDownloadURL().then(url => {
          this.draftImageDownloadURL = url;
          this.addMessage();
          event.target.value = '';
        });
      }
    );
  }

}

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
      <div *ngIf="isMessageNewTimeGroup(message.timestamp)||first" style="text-align:center;padding:25px 15px 15px 15px;color:#777">{{message.timestamp|date:'yMMMMEEEEd'}}</div>
      <div style="box-shadow: 0 0 2px rgba(0, 0, 0, 0.1);cursor:pointer;border-width:0 0 0 3px;border-style:solid;border-radius:7px" [style.margin]="isMessageNewUserGroup(message.user,message.timestamp)||first?'15px 25px 0 10px':'2px 25px 0 70px'"
      [style.border-color]="lastChatVisitTimestamp<message.timestamp?'red':'white'" [style.background-color]="message.action=='confirmation'||message.action=='add'?'#e6efe6':message.action=='warning'||message.action=='remove'?'#efeac6':'white'" (click)="timestampChatVisit()">
        <div *ngIf="isMessageNewUserGroup(message.user,message.timestamp)||first" style="float:left;width:60px;min-height:10px">
          <img (error)="errorHandler($event)" [src]="DB.getUserPhotoThumb(message.user)" style="cursor:pointer;display:inline;float:left;margin: 5px 10px 10px 10px; border-radius:3px; object-fit: cover; height:35px; width:35px" (click)="router.navigate(['user',message.user])">
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
          <div *ngIf="!message.image" style="float:left;color:#404040;margin:5px" [innerHTML]="message.text | linky"></div>
          <div *ngIf="message.linkTeam" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['chat',message.linkTeam])">
            <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoThumb(message.linkTeam)" style="float:left;object-fit:cover;height:25px;width:40px;border-radius:3px">
            <div style="font-size:11px;padding:5px;">{{DB.getTeamName(message.linkTeam)}}</div>
          </div>
          <div *ngIf="message.linkUser" style="float:left;cursor:pointer;margin:5px" (click)="router.navigate(['user',message.linkUser])">
            <img (error)="errorHandler($event)" [src]="DB.getUserPhotoThumb(message.linkUser)" style="float:left;object-fit:cover;height:25px;width:25px">
            <div style="font-size:11px;padding:5px;">{{DB.getUserFirstName(message.linkUser)}} {{DB.getUserLastName(message.linkUser)}}</div>
          </div>
          <div *ngIf="message.process!==undefined" style="float:left;background-color:#c7edcd;border-radius:5px;padding:3px;margin:5px">
            <div *ngIf="message.process.result!==undefined" style="font-size:11px;line-height:normal">{{DB.getServiceRegex(message.process.service)}}: {{message.process.result}}</div>
          </div>
          <div style="clear:both;text-align:center">
            <img class="imageWithZoom" *ngIf="message.image" [src]="DB.getMessageImageMedium(message.image)?DB.getMessageImageMedium(message.image):message.imageDownloadURL" style="clear:both;width:95%;max-height:320px;object-fit:contain;margin:5px 10px 5px 5px;border-radius:3px" (click)="showFullScreenImage(DB.getMessageImageOriginal(message.image)?DB.getMessageImageOriginal(message.image):message.imageDownloadURL)">
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
      <div [hidden]="!user.draftMessage||user.$key==UI.currentUser" *ngIf="isDraftMessageRecent(user.draftMessageTimestamp)" style="padding:5px 0 5px 15px;float:left;font-weight:bold">{{DB.getUserFirstName(user.$key)}}...</div>
      </li>
    </ul>
    <img *ngIf="!UI.serviceMessage&&DB.getTeamLeader(UI.currentTeam,UI.currentUser)" src="./../assets/App icons/process.png" style="cursor:pointer;width:25px;float:right;margin:5px 20px 5px 10px" (click)="this.router.navigate(['help'])">
    <div *ngIf="UI.serviceMessage" style="box-shadow: 0 0 2px rgba(0, 0, 0, 0.1);cursor:pointer;border-radius:7px 7px 0 7px;background-color:white;float:right;color:#192368;padding:3px;margin:5px"(click)="UI.clearProcessData()">{{UI.serviceMessage}}</div>
    <div style="clear:both;float:left;width:90%">
      <textarea id="inputMessage" [hidden]='!(DB.getTeamLeader(UI.currentTeam,UI.currentUser)||DB.getTeamMember(UI.currentTeam,UI.currentUser))' style="float:left;width:95%;border-style:none;padding:9px;margin:10px;border-radius:3px;resize:none;overflow-y:scroll" maxlength="500" (keyup.enter)="addMessage()" (keyup)="updateDraftMessageDB()" [(ngModel)]="draftMessage" placeholder="Message team"></textarea>
    </div>
    <div style="float:right;width:10%">
      <input type="file" name="chatImage" id="chatImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
      <label class="buttonUploadImage" *ngIf='DB.getTeamLeader(UI.currentTeam,UI.currentUser)||DB.getTeamMember(UI.currentTeam,UI.currentUser)' for="chatImage" id="buttonFile">
      <img src="./../assets/App icons/camera.png" style="width:25px;margin:20px 5px 5px 5px">
      </label>
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

  constructor(public sanitizer: DomSanitizer, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
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
            imageDownloadURL:this.draftImageDownloadURL,
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
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
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
      }
    );
  }

}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'user',
  template: `
  <div class="sheet">
  <div style="float: left;width:80%">
  <div class="buttonDiv" *ngIf='editMode' style="color:green;border-style:none;float:right" [hidden]='!(UI.currentUser==UI.focusUser)' (click)="editMode=false;updateUserProfile()">Done</div>
  <div [hidden]='editMode'>
  <div class='title'>{{DB.getUserFirstName(UI.focusUser)}} {{DB.getUserLastName(UI.focusUser)}}</div>
  <img class='editButton' [hidden]='!(UI.currentUser==UI.focusUser)' (click)="editMode=true" src="./../assets/App icons/pencil-tip.png">
  </div>
  <div [hidden]='!editMode'>
  <input maxlength="20" [(ngModel)]="DB.userFirstName[UI.focusUser]" style="text-transform: lowercase; font-weight:bold;" placeholder="first name *" />
  <input maxlength="20" [(ngModel)]="DB.userLastName[UI.focusUser]" style="text-transform: lowercase; font-weight:bold;" placeholder="last name *" />
  </div>
  </div>
  <div style="float: right;width:20%;position:relative">
  <img class="imageWithZoom" (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(UI.focusUser)" style="background-color:#0e0e0e;float:right;object-fit:cover;height:75px;width:75px" (click)="showFullScreenImage(DB.getUserPhotoURL(UI.focusUser))">
  <div *ngIf="!isImageOnFirebase" [hidden]='!(UI.currentUser==UI.focusUser)' style="font-size:15px;color:white;position:absolute;width:100%;text-align:center;top:75px">Please upload a new image</div>
  <div *ngIf="editMode" style="position:absolute;left:10px;top:10px;">
  <input type="file" name="projectImage" id="projectImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
  <label class="buttonUploadImage" for="projectImage" id="buttonFile">
  <img src="./../assets/App icons/camera.png" style="width:25px">
  <span class="tipText">Max 3.0Mb</span>
  </label>
  </div>
  </div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div style="width:100px;font-size:10px;cursor:pointer;color:blue;padding:5px;" (click)="router.navigate(['chat','-KtmuFyG2XEmWm8oNOGT'])">How it works</div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="buttonDiv" *ngIf="(UI.currentUser==UI.focusUser)" style="float:right;margin:5px" (click)="this.router.navigate(['createTeam'])">New team</div>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === UI.currentTeam"
      (click)="router.navigate(['chat',team.$key])">
      <div *ngIf="DB.getUserFollowing(UI.focusUser,team.$key)">
      <div *ngIf="team.lastChatVisitTimestampNegative">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:40px;width:60px">
      <div style="float:left;margin-top:10px;color:#222">{{DB.getTeamName(team.$key)}}{{(DB.getUserLeader(team.$key,UI.focusUser)?" *":"")}}</div>
      <img [hidden]="!(DB.getTeamBalance(team.$key)>0)" src="./../assets/App icons/PERRINN-icon-180x180.png" style="float:left;height:12px;margin:5px;margin-top:14px">
      <div style="float:left;margin:5px;margin-top:14px;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="DB.getTeamLastMessageTimestamp(team.$key)>team.lastChatVisitTimestamp"></div>
      <div class="buttonDiv" style="color:red;border:none" [hidden]='!editMode' (click)="unfollow(team.$key)">Stop following</div>
      <div style="float:right;margin-top:10px;color:#999;margin-right:10px">{{team.lastChatVisitTimestamp|date:'d MMM'}}</div>
      <div class="seperator"></div>
      </div>
      </div>
    </li>
  </ul>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === UI.currentTeam"
      (click)="router.navigate(['chat',team.$key])">
      <div *ngIf="DB.getUserFollowing(UI.focusUser,team.$key)">
      <div *ngIf="!team.lastChatVisitTimestampNegative">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:40px;width:60px">
      <div style="float:left;margin-top:10px;color:#222">{{DB.getTeamName(team.$key)}}{{(DB.getUserLeader(team.$key,UI.focusUser)?" *":"")}}</div>
      <img [hidden]="!(DB.getTeamBalance(team.$key)>0)" src="./../assets/App icons/PERRINN-icon-180x180.png" style="float:left;height:12px;margin:5px;margin-top:14px">
      <div style="float:left;margin:5px;margin-top:14px;background-color:red;width:12px;height:12px;border-radius:6px" *ngIf="DB.getTeamLastMessageTimestamp(team.$key)>team.lastChatVisitTimestamp"></div>
      <div class="buttonDiv" style="color:red;border:none" [hidden]='!editMode' (click)="unfollow(team.$key)">Stop following</div>
      <div style="float:right;margin-top:10px;color:#999;margin-right:10px">{{team.lastChatVisitTimestamp|date:'d MMM'}}</div>
      <div class="seperator"></div>
      </div>
      </div>
    </li>
  </ul>
  </div>
  <div class='sheet' *ngIf="(UI.currentUser==UI.focusUser)" style="margin-top:10px">
  <div class="buttonDiv" style="color:red" (click)="this.logout();router.navigate(['login']);">logout</div>
  </div>
  <div class='sheet' style="margin-top:10px">
    <div class="title">Selected projects</div>
    <ul class='listLight' style="max-width:620px;display:block;margin:0 auto">
      <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="router.navigate(['project',project.$key])">
        <img (error)="errorHandler($event)"[src]="DB.getProjectPhotoURL(project.$key)" style="object-fit: cover; height:125px; width:125px;position:relative">
        <div style="height:25px;font-size:10px;line-height:10px">{{DB.getProjectName(project.$key)}}</div>
      </li>
    </ul>
  </div>
  `,
})
export class UserProfileComponent {
  editMode: boolean;
  userTeams: FirebaseListObservable<any>;
  isImageOnFirebase: boolean;
  teamProjects: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.isImageOnFirebase=true;
    this.route.params.subscribe(params => {
      this.UI.focusUser = params['id'];
      this.editMode = false;
      if(this.DB.getUserPhotoURL(this.UI.focusUser)) this.isImageOnFirebase = this.DB.getUserPhotoURL(this.UI.focusUser).substring(0,23)=='https://firebasestorage'
      this.userTeams=db.list('userTeams/'+this.UI.focusUser, {
        query:{
          orderByChild:'lastChatVisitTimestampNegative',
        }
      });
    });
    this.teamProjects = this.db.list('teamProjects/-Kp0TqKyvqnFCnLryKC1', {
      query:{
        orderByChild:'following',
        equalTo: true,
      }
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  updateUserProfile() {
    this.DB.userFirstName[this.UI.focusUser] = this.DB.userFirstName[this.UI.focusUser].toLowerCase();
    this.DB.userLastName[this.UI.focusUser] = this.DB.userLastName[this.UI.focusUser].toLowerCase();
    this.db.list('users/'+this.UI.focusUser).push({
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      firstName: this.DB.userFirstName[this.UI.focusUser],
      lastName: this.DB.userLastName[this.UI.focusUser],
      photoURL: this.DB.userPhotoURL[this.UI.focusUser],
    });
    this.editMode=false;
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
        this.DB.userPhotoURL[this.UI.focusUser]=task.snapshot.downloadURL;
      }
    );
  }

  logout() {
    this.afAuth.auth.signOut()
  }

  unfollow(teamID: string) {
    this.db.object('userTeams/'+this.UI.currentUser+'/'+teamID).update({following:false});
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

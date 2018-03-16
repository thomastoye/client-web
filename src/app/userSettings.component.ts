import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'userSettings',
  template: `
  <div class="sheet" style="background-color:#f5f5f5">
  <div class="title">Profile</div>
  <div style="float: left;width:80%">
  <input maxlength="20" [(ngModel)]="firstName" style="text-transform: lowercase; font-weight:bold;" placeholder="first name *" />
  <input maxlength="20" [(ngModel)]="lastName" style="text-transform: lowercase; font-weight:bold;" placeholder="last name *" />
  </div>
  <div style="float: right;width:20%;position:relative">
  <img class="imageWithZoom" (error)="errorHandler($event)" [src]="photoURL" style="background-color:#0e0e0e;float:right;object-fit:cover;height:75px;width:75px" (click)="showFullScreenImage(photoURL)">
  <div style="position:absolute;left:10px;top:10px;">
  <input type="file" name="projectImage" id="projectImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
  <label class="buttonUploadImage" for="projectImage" id="buttonFile">
  <img src="./../assets/App icons/camera.png" style="width:25px">
  <span class="tipText">Max 3.0Mb</span>
  </label>
  </div>
  </div>
  <div *ngIf="(firstName!=DB.getUserFirstName(UI.focusUser)||lastName!=DB.getUserLastName(UI.focusUser)||photoURL!=DB.getUserPhotoURL(UI.focusUser))&&firstName!=null&&lastName!=null&&photoURL!=null" class="buttonDiv" (click)="saveUserProfile();router.navigate(['user',UI.currentUser])" style="clear:both">Save profile</div>
  <div class="title">Teams</div>
  <div style="font-size:10px;padding:10px;color:#888">(Your personal team is where specific messages are sent to you and were you should keep your personal COINS.)</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === UI.currentTeam">
      <div *ngIf="DB.getUserFollowing(UI.focusUser,team.$key)">
      <div style="width:300px;float:left">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:20px;width:30px;border-radius:3px">
      <div style="float:left;margin-top:10px;color:#222">{{DB.getTeamName(team.$key)}}{{(DB.getTeamLeader(team.$key,UI.focusUser)?" *":"")}}</div>
      </div>
      <div style="width:100px;height:30px;float:left">
      <div *ngIf="!DB.getTeamLeader(team.$key,UI.focusUser)" class="buttonDiv" style="font-size:11px;color:red" (click)="db.object('userTeams/'+UI.currentUser+'/'+team.$key).update({following:false})">Stop following</div>
      </div>
      <div style="width:150px;height:30px:float:left">
      <div *ngIf="personalTeam==DB.getUserPersonalTeam(UI.focusUser)">
        <div *ngIf="DB.getTeamLeader(team.$key,UI.focusUser)&&personalTeam!=team.$key" class="buttonDiv" style="font-size:11px;color:blue" (click)="personalTeam=team.$key;db.list('users/'+UI.focusUser).push({personalTeam:team.$key})">Set as personal team</div>
      <div *ngIf="personalTeam==team.$key" class="buttonDiv" style="cursor:default;font-size:11px;color:green;border:none">Personal team</div>
      </div>
      </div>
      <div class="seperator"></div>
      </div>
    </li>
  </ul>
  </div>
  `,
})
export class UserSettingsComponent {
  firstName:string;
  lastName:string;
  photoURL:string;
  personalTeam:string;
  userTeams: FirebaseListObservable<any>;
  isImageOnFirebase: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.isImageOnFirebase=true;
    this.route.params.subscribe(params => {
      this.UI.focusUser = params['id'];
      this.UI.currentTeam="";
      this.firstName=this.DB.getUserFirstName(this.UI.focusUser);
      this.lastName=this.DB.getUserLastName(this.UI.focusUser);
      this.photoURL=this.DB.getUserPhotoURL(this.UI.focusUser);
      this.personalTeam=this.DB.getUserPersonalTeam(this.UI.focusUser);
      if(this.DB.getUserPhotoURL(this.UI.focusUser)) this.isImageOnFirebase = this.DB.getUserPhotoURL(this.UI.focusUser).substring(0,23)=='https://firebasestorage'
      this.userTeams=db.list('userTeams/'+this.UI.focusUser, {
        query:{
          orderByChild:'lastChatVisitTimestampNegative',
        }
      });
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  saveUserProfile() {
    this.firstName = this.firstName.toLowerCase();
    this.lastName = this.lastName.toLowerCase();
    this.db.list('users/'+this.UI.focusUser).push({
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      firstName: this.firstName,
      lastName: this.lastName,
      photoURL: this.photoURL,
    });
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
        this.photoURL=task.snapshot.downloadURL;
      }
    );
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { Router, NavigationEnd } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'teamProfile',
  template: `
  <div class='sheet'>
  <div style="position:relative;margin-bottom:-115px">
  <img class="imageWithZoom" (error)="errorHandler($event)"[src]="photoURL" style="object-fit:cover;background-color:#0e0e0e;max-height:250px; width:100%" (click)="showFullScreenImage(photoURL)">
  <div *ngIf="!isImageOnFirebase" [hidden]='!getUserLeader(UI.currentTeam)' style="font-size:15px;color:white;position:absolute;width:100%;text-align:center;top:75px">Please upload a new image</div>
  <div *ngIf="editMode" style="position:absolute;left:10px;top:10px;">
  <input type="file" name="teamImage" id="teamImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
  <label class="buttonUploadImage" for="teamImage" id="buttonFile">
  <img src="./../assets/App icons/camera.png" style="width:25px">
  <span class="tipText">Max 3.0Mb</span>
  </label>
  </div>
  <div class="sheetBadge" style="position:relative;top:-115px">
  <div *ngIf="!editMode" style="text-align:center;font-size:18px;line-height:30px;font-family:sans-serif;">{{teamName}}</div>
  <input maxlength="25" *ngIf="editMode" [(ngModel)]="teamName" style="text-transform: uppercase;" placeholder="Enter team name" />
  <div class="buttonDiv" *ngIf="!getUserFollowing(UI.currentUser,UI.currentTeam)" (click)="followTeam(UI.currentTeam, UI.currentUser)">Follow</div>
  <ul class='listLight' style="display:inline-block;float:left">
    <li class='userIcon' *ngFor="let user of teamLeaders | async" (click)="UI.focusUser=user.$key;router.navigate(['userProfile'])">
      <img (error)="errorHandler($event)"[src]="getPhotoURL(user.$key)" style="object-fit: cover; height:140px; width:140px">
    </li>
  </ul>
  <ul class='listLight' style="display:inline-block">
    <li class='userIcon' *ngFor="let user of teamMembers | async" (click)="UI.focusUser=user.$key;router.navigate(['userProfile'])">
      <div *ngIf="!user.leader">
      <img (error)="errorHandler($event)"[src]="getPhotoURL(user.$key)" style="object-fit: cover; height:70px; width:70px">
      <div class="buttonDiv" *ngIf='editMode' style="font-size:10px;line-height:10px;border-style:none;color:red" (click)="db.object('teamUsers/'+UI.currentTeam+'/'+user.$key).update({member:false,leader:false})">Remove</div>
      <div class="buttonDiv" *ngIf='editMode' style="font-size:10px;line-height:10px;border-style:none;color:green" (click)="db.object('teamUsers/'+UI.currentTeam+'/'+user.$key).update({member:true,leader:true})">Make co-leader</div>
      </div>
    </li>
  </ul>
  <div style="clear:both"></div>
  <ul style="clear:both;display:inline-block;float:left">
    <li *ngFor="let user of teamLeaders | async" style="display:inline-block;float:left">
      <div style="margin:0 0 5px 15px;font-size:12px;line-height:15px;font-family:sans-serif;">{{getFirstName(user.$key)}}*</div>
    </li>
  </ul>
  <ul style="display:inline-block;float:left">
    <li *ngFor="let user of teamMembers | async" style="display:inline-block;float:left">
      <div *ngIf="!user.leader">
        <div style="margin:0 0 5px 15px;font-size:12px;line-height:15px;font-family:sans-serif;">{{getFirstName(user.$key)}}{{getUserFollowing(user.$key,UI.currentTeam)?"":" (NF)"}}</div>
      </div>
    </li>
  </ul>
  <div class="buttonDiv" *ngIf='editMode' style="border-style:none" (click)="this.router.navigate(['addMember'])">Add a member</div>
  </div>
  </div>
  </div>
  <div class='sheet'>
  <div class='appIcon' (click)="router.navigate(['wallet'])">
  <img src="./../assets/App icons/icon_share_03.svg" style="width:30px">
  <div style="font-size:11px">Wallet</div>
  </div>
  <div class='appIcon' (click)="router.navigate(['links'])">
  <img src="./../assets/App icons/infinite-outline.png" style="width:30px">
  <div style="font-size:11px">Links</div>
  </div>
  <div class='appIcon' (click)="router.navigate(['chat'])">
  <img src="./../assets/App icons/communication-icons-6.png" style="width:30px">
  <div style="font-size:11px">Chat</div>
  </div>
  <span class="buttonDiv" *ngIf='!editMode' style="border-style:none;float:right" [hidden]='!getUserLeader(UI.currentTeam)' (click)="editMode=true">Edit</span>
  <span class="buttonDiv" *ngIf='editMode' style="color:green;border-style:none;float:right" (click)="editMode=false;saveTeamProfile()">Done</span>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">Following</div>
  <ul class='listLight'>
    <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="UI.focusProject=project.$key;router.navigate(['projectProfile'])">
      <img (error)="errorHandler($event)"[src]="getProjectPhotoURL(project.$key)" style="object-fit: cover; height:125px; width:125px;position:relative">
      <div style="height:25px;font-size:10px;line-height:10px">{{getProjectName(project.$key)}}{{(getTeamLeader(project.$key,UI.currentTeam)? " **" : "")}}</div>
    </li>
  </ul>
  <button *ngIf="editMode" (click)="this.router.navigate(['followProject'])" style="background-color:#c69b00">Follow a project</button>
  <button *ngIf="editMode" [hidden]='!getUserLeader(UI.currentTeam)' (click)="this.router.navigate(['createProject'])" style="background-color:#c69b00">Create a project</button>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Ad</div>
  <div *ngIf="editMode" style="float: right;">
    <ul class='listLight'>
      <li (click)="db.object('teamAds/'+UI.currentTeam).update({memberAdVisible:!memberAdVisible})">
        <div class='cornerButton' style="float:right">Ad</div>
      </li>
    </ul>
  </div>
  <div style="clear:left">
    <textarea [hidden]='!memberAdVisible' class="textAreaAdvert" style="max-width:400px" rows="10" maxlength="500" [(ngModel)]="memberAdText" (keyup)="updateMemberAdDB()" placeholder="Looking for new Members or Leaders for your team? Write an advert here."></textarea>
    <div style="text-align:left; cursor:pointer; color:blue; padding:10px;" (click)="router.navigate(['teamAds'])">View all Ads</div>
  </div>
  </div>
`,
})
export class TeamProfileComponent  {

  photoURL: string;
  teamName: string;
  editMode: boolean;
  teamLeaders: FirebaseListObservable<any>;
  teamMembers: FirebaseListObservable<any>;
  teamProjects: FirebaseListObservable<any>;
  newMemberID: string;
  memberAdText: string;
  memberAdVisible: boolean;
  isImageOnFirebase: boolean;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService) {
    this.editMode = false;
    this.memberAdVisible=false;
    this.db.object('teams/'+this.UI.currentTeam).subscribe (team=>{
      this.teamName = team.name;
      this.photoURL = team.photoURL;
      if(this.photoURL!=null) this.isImageOnFirebase = this.photoURL.substring(0,23)=='https://firebasestorage'
    });
    this.db.object('teamAds/'+this.UI.currentTeam+'/memberAdText').subscribe(memberAdText => {
      this.memberAdText = memberAdText.$value;
    });
    this.db.object('teamAds/'+this.UI.currentTeam+'/memberAdVisible').subscribe(memberAdVisible => {
      this.memberAdVisible = memberAdVisible.$value;
    });
    this.teamProjects = this.db.list('teamProjects/'+this.UI.currentTeam, {
      query:{
        orderByChild:'following',
        equalTo: true,
      }
    });
    this.teamLeaders = this.db.list('teamUsers/'+this.UI.currentTeam, {
      query:{
        orderByChild:'leader',
        equalTo: true,
      }
    });
    this.teamMembers = this.db.list('teamUsers/'+this.UI.currentTeam, {
      query:{
        orderByChild:'member',
        equalTo: true,
      }
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  getProjectName (ID: string) :string {
    var output;
    this.db.object('projects/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  getFirstName (ID: string) :string {
    var output;
    this.db.object('users/' + ID).subscribe(snapshot => {
      output = snapshot.firstName;
    });
    return output;
  }

  getUserFollowing (userID: string, teamID: string) :boolean {
    var output;
    this.db.object('userTeams/' + userID + '/' + teamID).subscribe(snapshot => {
      output = snapshot.following
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

  getProjectPhotoURL (ID: string) :string {
    var output;
    this.db.object('projects/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  getUserLeader (ID: string) :string {
    var output;
    this.db.object('teamUsers/' + ID + '/' + this.UI.currentUser).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  getTeamLeader (projectID: string, teamID: string) :string {
    var output;
    this.db.object('projectTeams/' + projectID + '/' + teamID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  saveTeamProfile() {
    this.teamName = this.teamName.toUpperCase();
    this.db.object('teams/' + this.UI.currentTeam).update({
      name: this.teamName, photoURL: this.photoURL,
    })
  }

  updateMemberAdDB () {
    this.db.object('teamAds/'+this.UI.currentTeam).update({
      memberAdText:this.memberAdText,
      memberAdTimestamp:firebase.database.ServerValue.TIMESTAMP,
    });
  }

  followTeam (teamID: string, userID: string) {
    this.db.object('userTeams/'+userID+'/'+teamID).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
    this.UI.currentTeam=teamID;
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

import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router, NavigationEnd } from '@angular/router'

@Component({
  selector: 'teamProfile',
  template: `
  <div class='sheet'>
  <div style="margin-bottom:-50px;position:relative">
  <img class="imageWithZoom" (error)="errorHandler($event)"[src]="photoURL" style="object-fit:contain;background-color:#0e0e0e;max-height:350px; width:100%" (click)="showFullScreenImage(photoURL)">
  <div *ngIf="!isImageOnFirebase" [hidden]='!getUserLeader(currentTeamID)' style="font-size:15px;color:white;position:absolute;width:100%;text-align:center;top:75px">Please upload a new image</div>
  <div *ngIf="editMode" style="position:absolute;left:10px;top:10px;">
  <input type="file" name="teamImage" id="teamImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
  <label class="buttonUploadImage" for="teamImage" id="buttonFile">
  <img src="./../assets/App icons/camera.png" style="width:25px">
  <span class="tipText">Max 3.0Mb</span>
  </label>
  </div>
  <div class="sheetBadge" style="position:relative;top:-50px">
  <div *ngIf="!editMode" style="text-align:center;font-size:18px;font-family:sans-serif;">{{teamName}}</div>
  <input maxlength="25" *ngIf="editMode" [(ngModel)]="teamName" style="text-transform: uppercase;" placeholder="Enter team name" />
  <div style="color:blue;clear:both;cursor:pointer;text-align:center" (click)="router.navigate(['wallet'])">{{currentBalance | number:'1.2-2'}} COINS</div>
  <div class="buttonDiv" *ngIf="!getUserFollowing(currentUserID,currentTeamID)" (click)="followTeam(currentTeamID, currentUserID)">Follow</div>
  <div class="buttonDiv" *ngIf='!editMode' style="border-style:none" [hidden]='!getUserLeader(currentTeamID)' (click)="editMode=true">Edit</div>
  <div class="buttonDiv" *ngIf='editMode' style="color:green;border-style:none" (click)="editMode=false;saveTeamProfile()">Done</div>
  <ul class='listLight' style="display:inline-block;float:left">
    <li class='userIcon' *ngFor="let user of teamLeaders | async" (click)="db.object('userInterface/'+currentUserID).update({focusUser: user.$key});router.navigate(['userProfile'])">
      <img (error)="errorHandler($event)"[src]="getPhotoURL(user.$key)" style="margin:5px;border-radius:3px; object-fit: cover; height:130px; width:130px">
    </li>
  </ul>
  <ul class='listLight' style="display:inline-block">
    <li class='userIcon' *ngFor="let user of teamMembers | async" (click)="db.object('userInterface/'+currentUserID).update({focusUser:user.$key});router.navigate(['userProfile'])">
      <div *ngIf="!user.leader">
      <img (error)="errorHandler($event)"[src]="getPhotoURL(user.$key)" style="margin:5px;border-radius:3px; object-fit: cover; height:60px; width:60px">
      <div *ngIf="!getUserFollowing(user.$key,currentTeamID)" style="font-size:10px;text-align:center">NOT FOLLOWING</div>
      <div class="buttonDiv" *ngIf='editMode' style="font-size:10px;line-height:10px;border-style:none;color:red" (click)="db.object('teamUsers/'+currentTeamID+'/'+user.$key).update({member:false,leader:false})">Remove</div>
      <div class="buttonDiv" *ngIf='editMode' style="font-size:10px;line-height:10px;border-style:none;color:green" (click)="db.object('teamUsers/'+currentTeamID+'/'+user.$key).update({member:true,leader:true})">Make co-leader</div>
      </div>
    </li>
  </ul>
  <div class="buttonDiv" *ngIf='editMode' style="border-style:none" (click)="this.router.navigate(['addMember'])">Add a member</div>
  </div>
  </div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">Following</div>
  <ul class='listLight'>
    <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="db.object('userInterface/'+currentUserID).update({focusProject: project.$key});router.navigate(['projectProfile'])">
      <img (error)="errorHandler($event)"[src]="getProjectPhotoURL(project.$key)" style="object-fit: cover; height:125px; width:125px;position:relative">
      <div style="height:25px;font-size:10px;line-height:10px">{{getProjectName(project.$key)}}{{(getTeamLeader(project.$key,currentTeamID)? " **" : "")}}</div>
    </li>
  </ul>
  <button *ngIf="editMode" (click)="this.router.navigate(['followProject'])" style="background-color:#c69b00">Follow a project</button>
  <button *ngIf="editMode" [hidden]='!getUserLeader(currentTeamID)' (click)="this.router.navigate(['createProject'])" style="background-color:#c69b00">Create a project</button>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Ad</div>
  <div *ngIf="editMode" style="float: right;">
    <ul class='listLight'>
      <li (click)="db.object('teamAds/'+currentTeamID).update({memberAdVisible:!memberAdVisible})">
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
  currentUserID: string;
  currentTeamID: string;
  teamLeaders: FirebaseListObservable<any>;
  teamMembers: FirebaseListObservable<any>;
  teamProjects: FirebaseListObservable<any>;
  newMemberID: string;
  memberAdText: string;
  memberAdVisible: boolean;
  currentBalance: number;
  isImageOnFirebase: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.editMode = false;
    this.currentBalance=0;
    this.afAuth.authState.subscribe((auth) => {
      this.memberAdVisible=false;
      if (auth==null){
      }
      else {
        this.currentUserID = auth.uid;
        this.db.object('userInterface/'+auth.uid+'/currentTeam').subscribe(currentTeam => {
          this.currentTeamID = currentTeam.$value;
          this.db.object('teams/' + this.currentTeamID).subscribe (team=>{
            this.teamName = team.name;
            this.photoURL = team.photoURL;
            this.isImageOnFirebase = this.photoURL.substring(0,23)=='https://firebasestorage'
          });
          this.db.object('teamAds/'+this.currentTeamID+'/memberAdText').subscribe(memberAdText => {
            this.memberAdText = memberAdText.$value;
          });
          this.db.object('teamAds/'+this.currentTeamID+'/memberAdVisible').subscribe(memberAdVisible => {
            this.memberAdVisible = memberAdVisible.$value;
          });
          this.db.object('PERRINNTeamBalance/'+this.currentTeamID).subscribe(teamBalance => {
            if (teamBalance.balance) this.currentBalance = Number(teamBalance.balance)
          });
          this.teamProjects = this.db.list('teamProjects/' + currentTeam.$value, {
            query:{
              orderByChild:'following',
              equalTo: true,
            }
          });
          this.teamLeaders = this.db.list('teamUsers/' + currentTeam.$value, {
            query:{
              orderByChild:'leader',
              equalTo: true,
            }
          });
          this.teamMembers = this.db.list('teamUsers/' + currentTeam.$value, {
            query:{
              orderByChild:'member',
              equalTo: true,
            }
          });
        });
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
    if (ID == this.currentUserID) { output = "me"} else {
      this.db.object('users/' + ID).subscribe(snapshot => {
        output = snapshot.firstName;
      });
    }
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
    this.db.object('teamUsers/' + ID + '/' + this.currentUserID).subscribe(snapshot => {
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
    this.db.object('teams/' + this.currentTeamID).update({
      name: this.teamName, photoURL: this.photoURL,
    })
  }

  updateMemberAdDB () {
    this.db.object('teamAds/'+this.currentTeamID).update({
      memberAdText:this.memberAdText,
      memberAdTimestamp:firebase.database.ServerValue.TIMESTAMP,
    });
  }

  followTeam (teamID: string, userID: string) {
    this.db.object('userTeams/'+userID+'/'+teamID).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
    this.db.object('userInterface/'+userID).update({currentTeam: teamID});
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

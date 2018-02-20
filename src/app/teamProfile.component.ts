import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'team',
  template: `
  <div class='sheet'>
  <div style="position:relative;margin-bottom:-115px">
  <img class="imageWithZoom" (error)="errorHandler($event)"[src]="DB.getTeamPhotoURL(this.UI.currentTeam)" style="object-fit:cover;background-color:#0e0e0e;max-height:250px; width:100%" (click)="showFullScreenImage(DB.getTeamPhotoURL(this.UI.currentTeam))">
  <div *ngIf="!isImageOnFirebase" [hidden]='!DB.getUserLeader(UI.currentTeam,UI.currentUser)' style="font-size:15px;color:white;position:absolute;width:100%;text-align:center;top:75px">Please upload a new image</div>
  <div *ngIf="editMode" style="position:absolute;left:10px;top:10px;">
  <input type="file" name="teamImage" id="teamImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
  <label class="buttonUploadImage" for="teamImage" id="buttonFile">
  <img src="./../assets/App icons/camera.png" style="width:25px">
  <span class="tipText">Max 3.0Mb</span>
  </label>
  </div>
  <div class="sheetBadge" style="position:relative;top:-115px">
  <div *ngIf="!editMode" style="text-align:center;font-size:18px;line-height:30px;font-family:sans-serif;">{{DB.getTeamName(this.UI.currentTeam)}}</div>
  <input maxlength="25" *ngIf="editMode" [(ngModel)]="DB.teamName[this.UI.currentTeam]" style="text-transform: uppercase;" placeholder="Enter team name" />
  <div class="buttonDiv" *ngIf="!DB.getUserFollowing(UI.currentUser,UI.currentTeam)" (click)="followTeam(UI.currentTeam, UI.currentUser)">Follow</div>
  <ul class='listLight' style="display:inline-block;float:left">
    <li class='userIcon' *ngFor="let user of teamLeaders | async" (click)="router.navigate(['user',user.$key])">
      <img (error)="errorHandler($event)"[src]="DB.getUserPhotoURL(user.$key)" style="object-fit: cover; height:140px; width:140px">
    </li>
  </ul>
  <ul class='listLight' style="display:inline-block">
    <li class='userIcon' *ngFor="let user of teamMembers | async" (click)="router.navigate(['user',user.$key])">
      <div *ngIf="!user.leader">
      <img (error)="errorHandler($event)"[src]="DB.getUserPhotoURL(user.$key)" style="object-fit: cover; height:70px; width:70px">
      <div class="buttonDiv" *ngIf='editMode' style="font-size:10px;line-height:10px;border-style:none;color:red" (click)="db.object('teamUsers/'+UI.currentTeam+'/'+user.$key).update({member:false,leader:false})">Remove</div>
      <div class="buttonDiv" *ngIf='editMode' style="font-size:10px;line-height:10px;border-style:none;color:green" (click)="db.object('teamUsers/'+UI.currentTeam+'/'+user.$key).update({member:true,leader:true})">Make co-leader</div>
      </div>
    </li>
  </ul>
  <div style="clear:both"></div>
  <ul style="clear:both;display:inline-block;float:left">
    <li *ngFor="let user of teamLeaders | async" style="display:inline-block;float:left">
      <div style="margin:0 0 5px 15px;font-size:12px;line-height:15px;font-family:sans-serif;">{{DB.getUserFirstName(user.$key)}}*</div>
    </li>
  </ul>
  <ul style="display:inline-block;float:left">
    <li *ngFor="let user of teamMembers | async" style="display:inline-block;float:left">
      <div *ngIf="!user.leader">
        <div style="margin:0 0 5px 15px;font-size:12px;line-height:15px;font-family:sans-serif;">{{DB.getUserFirstName(user.$key)}}{{DB.getUserFollowing(user.$key,UI.currentTeam)?"":" (NF)"}}</div>
      </div>
    </li>
  </ul>
  <div class="buttonDiv" *ngIf='editMode' style="border-style:none" (click)="this.router.navigate(['addMember'])">Add a member</div>
  </div>
  </div>
  </div>
  <div class='sheet'>
  <div class='appIcon' (click)="router.navigate(['wallet',UI.currentTeam])">
  <img src="./../assets/App icons/icon_share_03.svg" style="width:30px">
  <div style="font-size:11px">Wallet</div>
  </div>
  <div class='appIcon' (click)="router.navigate(['notes',UI.currentTeam])">
  <img src="./../assets/App icons/note.png" style="width:30px">
  <div style="font-size:11px">Notes</div>
  </div>
  <div class='appIcon' (click)="router.navigate(['chat',UI.currentTeam])">
  <img src="./../assets/App icons/communication-icons-6.png" style="width:30px">
  <div style="font-size:11px">Chat</div>
  </div>
  <img class='editButton' src="./../assets/App icons/pencil-tip.png" style="float:right" *ngIf='!editMode' [hidden]='!DB.getUserLeader(UI.currentTeam,UI.currentUser)' (click)="editMode=true">
  <span class="buttonDiv" *ngIf='editMode' style="color:green;border-style:none;float:right" (click)="editMode=false;saveTeamProfile()">Done</span>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">Following</div>
  <ul class='listLight'>
    <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="router.navigate(['project',project.$key])">
      <img (error)="errorHandler($event)"[src]="DB.getProjectPhotoURL(project.$key)" style="object-fit: cover; height:125px; width:125px;position:relative">
      <div style="height:25px;font-size:10px;line-height:10px">{{DB.getProjectName(project.$key)}}{{(getTeamLeader(project.$key,UI.currentTeam)? " **" : "")}}</div>
    </li>
  </ul>
  <button *ngIf="editMode" (click)="this.router.navigate(['followProject'])" style="background-color:#c69b00">Follow a project</button>
  <button *ngIf="editMode" [hidden]='!DB.getUserLeader(UI.currentTeam,UI.currentUser)' (click)="this.router.navigate(['createProject'])" style="background-color:#c69b00">Create a project</button>
  </div>
`,
})
export class TeamProfileComponent  {

  editMode: boolean;
  teamLeaders: FirebaseListObservable<any>;
  teamMembers: FirebaseListObservable<any>;
  teamProjects: FirebaseListObservable<any>;
  newMemberID: string;
  memberAdText: string;
  memberAdVisible: boolean;
  isImageOnFirebase: boolean;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam=params['id'];
      this.editMode = false;
      this.memberAdVisible=false;
      if(this.DB.getTeamPhotoURL(this.UI.currentTeam)!=null) this.isImageOnFirebase = this.DB.getTeamPhotoURL(this.UI.currentTeam).substring(0,23)=='https://firebasestorage'
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
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  getTeamLeader (projectID: string, teamID: string) :string {
    var output;
    this.db.object('projectTeams/' + projectID + '/' + teamID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  saveTeamProfile() {
    this.DB.teamName[this.UI.currentTeam] = this.DB.teamName[this.UI.currentTeam].toUpperCase();
    this.db.object('teams/' + this.UI.currentTeam).update({
      name: this.DB.teamName[this.UI.currentTeam], photoURL: this.DB.teamPhotoURL[this.UI.currentTeam],
    })
  }

  followTeam (teamID: string, userID: string) {
    this.db.object('userTeams/'+userID+'/'+teamID).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
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
        this.DB.teamPhotoURL[this.UI.currentTeam]=task.snapshot.downloadURL;
      }
    );
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

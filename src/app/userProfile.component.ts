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
  <div style="float: left; width: 70%;">
  <div class="buttonDiv" *ngIf='!editMode' style="border-style:none;float:right" [hidden]='!ownProfile' (click)="editMode=true">Edit</div>
  <div class="buttonDiv" *ngIf='editMode' style="color:green;border-style:none;float:right" [hidden]='!ownProfile' (click)="editMode=false;updateUserProfile()">Done</div>
  <div [hidden]='editMode'>
  <div class='title'>{{DB.getUserFirstName(UI.focusUser)}} {{DB.getUserLastName(UI.focusUser)}}</div>
  <div style="padding:10px;font-size:12px;line-height:15px" [innerHTML]="DB.getUserResume(UI.focusUser) | linky"></div>
  </div>
  <div [hidden]='!editMode'>
  <input maxlength="20" [(ngModel)]="DB.userFirstName[UI.focusUser]" style="text-transform: lowercase; font-weight:bold;" placeholder="first name *" />
  <input maxlength="20" [(ngModel)]="DB.userLastName[UI.focusUser]" style="text-transform: lowercase; font-weight:bold;" placeholder="last name *" />
  <textarea class="textAreaInput" maxlength="140" [(ngModel)]="DB.userResume[UI.focusUser]" placeholder="Your resume (140 characters max) *"></textarea>
  </div>
  </div>
  <div style="float: right; width: 30%;position:relative">
  <img class="imageWithZoom" (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(UI.focusUser)" style="background-color:#0e0e0e;width:100%" (click)="showFullScreenImage(DB.getUserPhotoURL(UI.focusUser))">
  <div *ngIf="!isImageOnFirebase" [hidden]='!ownProfile' style="font-size:15px;color:white;position:absolute;width:100%;text-align:center;top:75px">Please upload a new image</div>
  <div *ngIf="editMode" style="position:absolute;left:10px;top:10px;">
  <input type="file" name="projectImage" id="projectImage" class="inputfile" (change)="onImageChange($event)" accept="image/*">
  <label class="buttonUploadImage" for="projectImage" id="buttonFile">
  <img src="./../assets/App icons/camera.png" style="width:25px">
  <span class="tipText">Max 3.0Mb</span>
  </label>
  </div>
  </div>
  </div>
  <div class="buttonDiv" style="color:red;width:325px" [hidden]='!editMode' (click)="unfollow(UI.currentTeam)">Stop following {{DB.getTeamName(UI.currentTeam)}}</div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">Leader</div>
  <div class="buttonDiv" *ngIf="ownProfile" style="float:right;margin:5px" (click)="this.router.navigate(['createTeam'])">New team</div>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
      (click)="router.navigate(['team',team.$key])">
      <div *ngIf="DB.getUserLeader(team.$key,UI.focusUser)">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px;object-fit:cover;height:40px;width:60px">
      <div style="width:200px;float:left;">{{DB.getTeamName(team.$key)}}</div>
      <div style="float:right;position:relative;margin-right:10px" (click)="router.navigate(['chat',team.$key])">
      <img src="./../assets/App icons/communication-icons-6.png" style="width:30px">
      <div class="activity" [hidden]="!getChatActivity(team.$key)"></div>
      </div>
      <div class="seperator"></div>
      </div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">Member</div>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
      (click)="router.navigate(['team',team.$key])">
      <div *ngIf="!DB.getUserLeader(team.$key,UI.focusUser)">
      <div *ngIf="DB.getUserMember(team.$key,UI.focusUser)">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px;object-fit:cover;height:40px;width:60px">
      <div style="width:200px;float:left;">{{DB.getTeamName(team.$key)}}</div>
      <div style="float:right;position:relative;margin-right:10px" (click)="router.navigate(['chat',team.$key])">
      <img src="./../assets/App icons/communication-icons-6.png" style="width:30px">
      <div class="activity" [hidden]="!getChatActivity(team.$key)"></div>
      </div>
      <div class="seperator"></div>
      </div>
      </div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title" style="float:left">Follower</div>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
      (click)="router.navigate(['team',team.$key])">
      <div *ngIf="!DB.getUserLeader(team.$key,UI.focusUser)">
      <div *ngIf="!DB.getUserMember(team.$key,UI.focusUser)">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px;object-fit:cover;height:40px;width:60px">
      <div style="width:200px;float:left;">{{DB.getTeamName(team.$key)}}</div>
      <div style="float:right;position:relative;margin-right:10px" (click)="router.navigate(['chat',team.$key])">
      <img src="./../assets/App icons/communication-icons-6.png" style="width:30px">
      <div class="activity" [hidden]="!getChatActivity(team.$key)"></div>
      </div>
      <div class="seperator"></div>
      </div>
      </div>
    </li>
  </ul>
  </div>
  <div class='sheet' *ngIf="ownProfile" style="margin-top:10px">
  <div class="buttonDiv" style="color:red" (click)="this.logout();router.navigate(['login']);">logout</div>
  </div>
  `,
})
export class UserProfileComponent {
  editMode: boolean;
  ownProfile: boolean;
  userTeams: FirebaseListObservable<any>;
  isImageOnFirebase: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.isImageOnFirebase=true;
    this.route.params.subscribe(params => {
      this.UI.focusUser = params['id'];
      this.editMode = false;
      this.ownProfile = (this.UI.currentUser==this.UI.focusUser);
      if(this.DB.getUserPhotoURL(this.UI.focusUser)) this.isImageOnFirebase = this.DB.getUserPhotoURL(this.UI.focusUser).substring(0,23)=='https://firebasestorage'
      this.userTeams=db.list('userTeams/'+this.UI.focusUser, {
        query:{
          orderByChild:'following',
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

  updateUserProfile() {
    this.DB.userFirstName[this.UI.focusUser] = this.DB.userFirstName[this.UI.focusUser].toLowerCase();
    this.DB.userLastName[this.UI.focusUser] = this.DB.userLastName[this.UI.focusUser].toLowerCase();
    this.db.object('users/'+this.UI.focusUser).update({
      firstName: this.DB.userFirstName[this.UI.focusUser], lastName: this.DB.userLastName[this.UI.focusUser], photoURL: this.DB.userPhotoURL[this.UI.focusUser], resume: this.DB.userResume[this.UI.focusUser]
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

  getChatActivity (ID: string) :boolean {
    var output = false;
    this.db.object('userTeams/' + this.UI.currentUser + '/' + ID).subscribe(userTeam => {
      this.db.object('teamActivities/'+ID).subscribe(teamActivities => {
        output = teamActivities.lastMessageTimestamp > userTeam.lastChatVisitTimestamp;
      });
    });
    return output;
  }

  unfollow(teamID: string) {
    this.db.object('userTeams/'+this.UI.currentUser+'/'+teamID).update({following:false});
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

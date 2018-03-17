import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'teamSettings',
  template: `
  <div class="sheet" style="background-color:#f5f5f5">
  <div class="title">Profile</div>
  <div style="float: left;width:80%">
  <input maxlength="20" [(ngModel)]="name" style="text-transform: upperCase; font-weight:bold;" placeholder="name *" />
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
  <div *ngIf="(name!=DB.getTeamName(UI.currentTeam)||photoURL!=DB.getTeamPhotoURL(UI.currentTeam))&&name!=null&&photoURL!=null" class="buttonDiv" (click)="saveTeamProfile();router.navigate(['team',UI.currentTeam])" style="clear:both">Save profile</div>
  <div class="title">Leaders</div>
  <div style="font-size:10px;padding:10px;color:#888">(Maximum 2 leaders per team)</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let user of teamLeaders | async; let i = index">
      <div style="float:left;padding:10px;font-size:11px">{{i+1}})</div>
      <div style="width:200px;float:left">
      <img (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(user.$key)" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:30px;width:30px;border-radius:3px">
      <div style="float:left;margin-top:10px;color:#222">{{DB.getUserFirstName(user.$key)}} {{DB.getUserLastName(user.$key)}}</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  <div class="title">Members</div>
  <div style="font-size:10px;padding:10px;color:#888">(Maximum 6 members per team)</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let user of teamMembers | async; let i = index">
      <div style="float:left;padding:10px;font-size:11px">{{i+1}})</div>
      <div style="width:200px;float:left">
      <img (error)="errorHandler($event)" [src]="DB.getUserPhotoURL(user.$key)" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:30px;width:30px;border-radius:3px">
      <div style="float:left;margin-top:10px;color:#222">{{DB.getUserFirstName(user.$key)}} {{DB.getUserLastName(user.$key)}}</div>
      </div>
      <div style="width:100px;float:left">
      <div *ngIf="DB.getTeamLeader(UI.currentTeam,UI.currentUser)" class="buttonDiv" style="font-size:11px;color:red" (click)="db.list('teams/'+UI.currentTeam).push({removeMember:user.$key})">Remove from team</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  <div *ngIf="UI.currentUser=='QYm5NATKa6MGD87UpNZCTl6IolX2'" class="buttonDiv" style="color:green" (click)="this.createTemplate()">create template</div>
  </div>
  `,
})
export class TeamSettingsComponent {
  name:string;
  photoURL:string;
  teamLeaders: FirebaseListObservable<any>;
  teamMembers: FirebaseListObservable<any>;
  teamProjects: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.currentTeam = params['id'];
      this.name=this.DB.getTeamName(this.UI.currentTeam);
      this.photoURL=this.DB.getTeamPhotoURL(this.UI.currentTeam);
      this.teamLeaders = this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/leaders');
      this.teamMembers = this.db.list('PERRINNTeams/'+this.UI.currentTeam+'/members');
    });
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  saveTeamProfile() {
    this.name = this.name.toUpperCase();
    this.db.list('teams/'+this.UI.currentTeam).push({
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      name: this.name,
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

  createTemplate(){
    this.name = this.name.toUpperCase();
    this.db.list('appSettings/teamTemplates').push({
      name:this.name,
      photoURL:this.photoURL,
    })
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

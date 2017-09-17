import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'projecProfile',
  template: `
  <div class="sheet">
  <div style="float: left; width: 60%;">
  <div [hidden]='editMode'>
  <div class='title' style="float:left">{{name}}</div>
  <div class="buttonDiv" style="border-style:none;float:left" [hidden]='!teamAndProjectLeader' (click)="editMode=true">Edit</div>
  <div class="buttonDiv" *ngIf="!getTeamFollowing(UI.currentTeam,UI.focusProject)" (click)="followProject(UI.focusProject, UI.currentTeam)">Follow</div>
  <div style="clear:both"></div>
  <div style="padding:10px;" [innerHTML]="goal | linky"></div>
  </div>
  <div [hidden]='!editMode'>
  <div class="buttonDiv" style="color:green;border-style:none;float:left" (click)="editMode=false;updateProjectProfile()">Done</div>
  <div style="clear:both"></div>
  <input maxlength="25" [(ngModel)]="name" style="text-transform: lowercase; font-weight:bold;" placeholder="first name *" />
  <textarea class="textAreaInput" maxlength="140" [(ngModel)]="goal" placeholder="Project goal (500 characters max) *"></textarea>
  <button *ngIf="editMode" (click)="this.router.navigate(['addTeam'])" style="background-color:#c69b00">Add a team</button>
  </div>
  </div>
  <div style="float: right; width: 40%;position:relative">
  <img class="imageWithZoom" (error)="errorHandler($event)" [src]="photoURL" style="background-color:#0e0e0e;object-fit:contain; height:200px; width:100%" (click)="showFullScreenImage(photoURL)">
  <div *ngIf="!isImageOnFirebase" [hidden]='!teamAndProjectLeader' style="font-size:15px;color:white;position:absolute;width:100%;text-align:center;top:75px">Please upload a new image</div>
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
  <div class="title">{{name}} teams</div>
  <ul class="listLight">
    <li *ngFor="let team of projectTeams | async"
      [class.selected]="team.$key === UI.currentTeam"
      (click)="UI.currentTeam=team.$key;router.navigate(['teamProfile'])">
      <img (error)="errorHandler($event)" [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div style="width:15px;height:25px;float:left;">{{getUserLeader(team.$key,UI.currentUser)?"*":""}}</div>
      <div style="width:300px;height:25px;float:left;">{{getTeamName(team.$key)}}{{(getTeamLeader(UI.focusProject,team.$key)? " **" : "")}}{{getTeamFollowing(team.$key,UI.focusProject)?"":" (Not Following)"}}</div>
      <button [hidden]='!teamAndProjectLeader' *ngIf="editMode" style="float:right" (click)="db.object('projectTeams/'+UI.focusProject+'/'+team.$key).update({member:false,leader:false});" style="background-color:red">Remove</button>
    </li>
  </ul>
  </div>
  `,
})
export class ProjectProfileComponent {
  name: string;
  goal: string;
  photoURL: string;
  editMode: boolean;
  memberStatus: string;
  leaderStatus: boolean;
  messageCancelMembership: string;
  teamAndProjectLeader: boolean;
  projectTeams: FirebaseListObservable<any>;
  isImageOnFirebase: boolean;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService) {
    this.messageCancelMembership = ""
    db.object('projects/' + this.UI.focusProject).subscribe(focusProject => {
      this.name = focusProject.name;
      this.goal = focusProject.goal;
      this.photoURL = focusProject.photoURL;
      if(this.photoURL!=null) this.isImageOnFirebase = this.photoURL.substring(0,23)=='https://firebasestorage'
      this.editMode = false;
      db.object('projectTeams/'+this.UI.focusProject+'/'+this.UI.currentTeam).subscribe(projectTeam => {
        db.object('teamUsers/'+this.UI.currentTeam+'/'+this.UI.currentUser).subscribe(teamUser => {
          this.teamAndProjectLeader=(teamUser.leader && projectTeam.leader);
        });
      });
    });
    this.projectTeams = db.list('projectTeams/' + this.UI.focusProject, {
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

  updateProjectProfile() {
    this.name = this.name.toUpperCase();
    this.db.object('projects/'+this.UI.focusProject).update({
      name: this.name, photoURL: this.photoURL, goal: this.goal
    });
    this.editMode=false;
  }

  cancelMember(projectID: string, teamID: string) {
    this.db.object('projectTeams/' + projectID + '/' + teamID).update({member:false})
    .then(_ => this.router.navigate(['teamProfile']))
    .catch(err => this.messageCancelMembership="Error: Only a leader can cancel a membership - A leader's membership cannot be cancelled");
  }

  getUserLeader (teamID: string, userID: string) :string {
    var output;
    this.db.object('teamUsers/' + teamID + '/' + userID).subscribe(snapshot => {
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

  getTeamFollowing (teamID: string, projectID: string) :boolean {
    var output;
    this.db.object('teamProjects/' + teamID + '/' + projectID).subscribe(snapshot => {
      output = snapshot.following
    });
    return output;
  }

  getTeamName (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  getTeamPhotoURL (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  followProject (projectID: string, teamID: string) {
    this.db.object('teamProjects/'+teamID+'/'+projectID).update({following: true});
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

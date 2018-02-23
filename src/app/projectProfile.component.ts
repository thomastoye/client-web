import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'projecProfile',
  template: `
  <div class="sheet">
  <div style="float: left; width: 60%;">
  <div [hidden]='editMode'>
  <div class='title' style="float:left">{{this.DB.getProjectName(UI.focusProject)}}</div>
  <img class='editButton' [hidden]='!projectLeader' (click)="editMode=true" src="./../assets/App icons/pencil-tip.png">
  <div style="clear:both"></div>
  <div style="padding:10px;font-size:12px" [innerHTML]="DB.getProjectGoal(UI.focusProject) | linky"></div>
  </div>
  <div [hidden]='!editMode'>
  <div class="buttonDiv" style="color:green;border-style:none;float:left" (click)="editMode=false;updateProjectProfile()">Done</div>
  <div style="clear:both"></div>
  <input maxlength="25" [(ngModel)]="this.DB.projectName[UI.focusProject]" style="text-transform: lowercase; font-weight:bold;" placeholder="name *" />
  <textarea class="textAreaInput" maxlength="140" [(ngModel)]="DB.projectGoal[UI.focusProject]" placeholder="Project goal (500 characters max) *"></textarea>
  <button *ngIf="editMode" (click)="this.router.navigate(['addTeam'])" style="background-color:#c69b00">Add a team</button>
  </div>
  </div>
  <div style="float: right; width: 40%;position:relative">
  <img class="imageWithZoom" (error)="errorHandler($event)" [src]="DB.getProjectPhotoURL(UI.focusProject)" style="background-color:#0e0e0e;object-fit:contain; height:200px; width:100%" (click)="showFullScreenImage(DB.getProjectPhotoURL(UI.focusProject))">
  <div *ngIf="!isImageOnFirebase" [hidden]='!projectLeader' style="font-size:15px;color:white;position:absolute;width:100%;text-align:center;top:75px">Please upload a new image</div>
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
  <div class="title">Teams</div>
  <ul class="listLight">
    <li *ngFor="let team of projectTeams | async"
      [class.selected]="team.$key === UI.currentTeam"
      (click)="router.navigate(['chat',team.$key])">
      <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div style="width:15px;height:25px;float:left;">{{DB.getUserLeader(team.$key,UI.currentUser)?"*":""}}</div>
      <div style="width:300px;height:25px;float:left;">{{DB.getTeamName(team.$key)}}{{(DB.getTeamLeader(UI.focusProject,team.$key)? " **" : "")}}{{DB.getTeamFollowing(team.$key,UI.focusProject)?"":" (Not Following)"}}</div>
      <button [hidden]='!projectLeader' *ngIf="editMode" style="float:right" (click)="db.object('projectTeams/'+UI.focusProject+'/'+team.$key).update({member:false,leader:false});" style="background-color:red">Remove</button>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
    <div class="title">Document</div>
    <input maxlength="250" [hidden]='!editMode' [(ngModel)]="DB.projectDocument[UI.focusProject]" placeholder="embedded document URL" />
    <iframe id='iframeDocument' width='100%' height='5000'></iframe>
  </div>
  `,
})
export class ProjectProfileComponent {
  editMode: boolean;
  memberStatus: string;
  leaderStatus: boolean;
  messageCancelMembership: string;
  projectLeader: boolean;
  leaderTeam: string;
  projectTeams: FirebaseListObservable<any>;
  isImageOnFirebase: boolean;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.focusProject=params['id'];
      this.messageCancelMembership = ""
      db.object('projects/' + this.UI.focusProject).subscribe(focusProject => {
        this.leaderTeam = focusProject.leader;
        if(this.DB.projectPhotoURL[UI.focusProject]!=null) this.isImageOnFirebase = this.DB.projectPhotoURL[UI.focusProject].substring(0,23)=='https://firebasestorage'
        this.editMode = false;
        db.object('teamUsers/'+this.leaderTeam+'/'+this.UI.currentUser).subscribe(teamUser => {
          this.projectLeader=(teamUser.member);
        });
      });
      this.projectTeams = db.list('projectTeams/' + this.UI.focusProject, {
        query:{
          orderByChild:'member',
          equalTo: true,
        }
      });
    });
  }

  ngAfterViewChecked () {
    var iframeDocument = <HTMLImageElement>document.getElementById('iframeDocument');
    if (this.DB.getProjectDocument(this.UI.focusProject)!=null && this.DB.getProjectDocument(this.UI.focusProject)!='') iframeDocument.src = this.DB.getProjectDocument(this.UI.focusProject);
  }

  showFullScreenImage(src){
    var fullScreenImage = <HTMLImageElement>document.getElementById("fullScreenImage");
    fullScreenImage.src=src;
    fullScreenImage.style.visibility='visible';
  }

  updateProjectProfile() {
    this.DB.projectName[this.UI.focusProject] = this.DB.projectName[this.UI.focusProject].toUpperCase();
    this.db.object('projects/'+this.UI.focusProject).update({
      name: this.DB.projectName[this.UI.focusProject], photoURL: this.DB.projectPhotoURL[this.UI.focusProject], goal: this.DB.projectGoal[this.UI.focusProject], document: this.DB.projectDocument[this.UI.focusProject]
    });
    this.editMode=false;
  }

  cancelMember(projectID: string, teamID: string) {
    this.db.object('projectTeams/' + projectID + '/' + teamID).update({member:false})
    .then(_ => this.router.navigate(['team',teamID]))
    .catch(err => this.messageCancelMembership="Error: Only a leader can cancel a membership - A leader's membership cannot be cancelled");
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
        this.DB.projectPhotoURL[this.UI.focusProject]=task.snapshot.downloadURL;
      }
    );
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

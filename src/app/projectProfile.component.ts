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
  <div class='title' style="float:left">{{this.DB.getProjectName(UI.focusProject)}}</div>
  <div style="clear:both"></div>
  <div style="padding:10px;font-size:12px" [innerHTML]="DB.getProjectGoal(UI.focusProject) | linky"></div>
  </div>
  <div style="float: right; width: 40%;position:relative">
  <img class="imageWithZoom" [src]="DB.getProjectImageUrlThumb(UI.focusProject)" style="object-fit:contain; height:200px; width:100%" (click)="showFullScreenImage(DB.getProjectImageUrlOriginal(UI.focusProject))">
  </div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">Teams</div>
  <ul class="listLight">
    <li *ngFor="let team of projectTeams | async"
      [class.selected]="team.$key === UI.currentTeam"
      (click)="router.navigate(['team',team.$key])">
      <img [src]="DB.getTeamImageUrlThumb(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      <div style="width:15px;height:25px;float:left;">{{DB.getTeamLeader(team.$key,UI.currentUser)?"*":""}}</div>
      <div style="width:300px;height:25px;float:left;">{{DB.getTeamName(team.$key)}}{{(DB.getProjectTeamLeader(UI.focusProject,team.$key)? " **" : "")}}</div>
    </li>
  </ul>
  </div>
  <div class='sheet' style="margin-top:10px">
    <div class="title">Document</div>
    <iframe id='iframeDocument' width='100%' height='10000'></iframe>
  </div>
  `,
})
export class ProjectProfileComponent {
  memberStatus: string;
  leaderStatus: boolean;
  messageCancelMembership: string;
  leaderTeam: string;
  projectTeams: FirebaseListObservable<any>;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
    document.getElementById("main_container").scrollTop = 0;
    this.route.params.subscribe(params => {
      this.UI.focusProject=params['id'];
      this.messageCancelMembership = ""
      db.object('projects/' + this.UI.focusProject).subscribe(focusProject => {
        this.leaderTeam = focusProject.leader;
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

  cancelMember(projectID: string, teamID: string) {
    this.db.object('projectTeams/' + projectID + '/' + teamID).update({member:false})
    .then(_ => this.router.navigate(['team',teamID]))
    .catch(err => this.messageCancelMembership="Error: Only a leader can cancel a membership - A leader's membership cannot be cancelled");
  }

}

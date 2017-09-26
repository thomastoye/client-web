import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'followProject',
  template: `
  <div class='sheet'>
  <ul class="listLight">
  <input maxlength="500" (keyup)="refreshProjectList()" [(ngModel)]="this.filter" style="texttransform:uppercase" placeholder="search project name">
    <li *ngFor="let project of projects | async"
      [class.selected]="project.$key === selectedProjectID"
      (click)="selectedProjectID = project.$key">
      <img (error)="errorHandler($event)"[src]="project.photoURL" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{project.name}}
    </li>
  </ul>
  <button style="background-color:#c69b00" (click)="followProject(selectedProjectID,UI.currentTeam)">Follow this project {{messageFollow}}</button>
  </div>
  `,
})

export class FollowProjectComponent  {

  firstName: string;
  photoURL: string;
  selectedProjectID: string;
  projects: FirebaseListObservable<any>;
  filter: string;
  messageFollow: string;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService) {
  }

  refreshProjectList () {
    this.filter = this.filter.toUpperCase();
    if (this.filter.length>1) {
    this.projects = this.db.list('projects/', {
      query:{
        orderByChild:'name',
        startAt: this.filter,
        endAt: this.filter+"\uf8ff",
        limitToFirst: 10
      }
    });
  }
  else this.projects = null;
}

  followProject (projectID: string, teamID: string) {
    if (projectID==null || projectID=="") {this.messageFollow = "Please select a project"}
    else {
      this.db.object('teamProjects/'+teamID+'/'+projectID).update({following: true});
      this.router.navigate(['team',teamID]);
    }
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

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
      <img (error)="errorHandler($event)"[src]="DB.getProjectImageUrlThumb(project.image)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{project.name}}
    </li>
  </ul>
  <button style="background-color:#c69b00" (click)="followProject(selectedProjectID,UI.currentTeam)">Follow this project {{messageFollow}}</button>
  </div>
  `,
})

export class FollowProjectComponent  {

  firstName: string;
  image: string;
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
      this.router.navigate(['team',teamID]);
    }
  }

  errorHandler(event) {
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
  }

}

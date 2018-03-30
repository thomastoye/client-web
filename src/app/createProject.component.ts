import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'createProject',
  template: `
  <div class="sheet">
  <div style="float: left; width: 50%;">
  <input maxlength="50" [(ngModel)]="projectName" style="text-transform: uppercase;" placeholder="Enter project name *" />
  <input maxlength="140" [(ngModel)]="projectGoal" placeholder="Enter project goal *" />
  <input maxlength="500" [(ngModel)]="photoURL" placeholder="Paste image from the web *" />
  <button style="background-color:#c69b00" (click)="createProject(UI.currentTeam, projectName)">Create project</button>
  </div>
  <div style="float: right; width: 50%;">
  <img (error)="errorHandler($event)"[src]="this.photoURL" style="object-fit:contain; height:200px; width:100%" routerLink="/user" routerLinkActive="active">
  </div>
  </div>
  `,
})
export class CreateProjectComponent {
  photoURL: string;
  projectName: string;
  projectGoal: string;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService) {
  }

  createProject(teamID: string, projectName: string) {
    projectName = projectName.toUpperCase();
    var projectID = this.db.list('ids/').push(true).key;
    this.db.object('projectTeams/'+projectID+'/'+teamID).update({member: true, leader: true});
    this.db.object('projects/'+projectID).update({name: projectName, goal: this.projectGoal, photoURL: this.photoURL});
    this.db.object('teamProjects/'+teamID+'/'+projectID).update({following: true});
    this.router.navigate(['team',teamID]);
  }

  errorHandler(event) {
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
  }

}

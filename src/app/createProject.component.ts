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
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

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
  <input maxlength="500" [(ngModel)]="image" placeholder="Paste image from the web *" />
  <button style="background-color:#c69b00" (click)="createProject(UI.currentTeam, projectName)">Create project</button>
  </div>
  <div style="float: right; width: 50%;">
  <img [src]="this.image" style="object-fit:contain; height:200px; width:100%" routerLink="/user" routerLinkActive="active">
  </div>
  </div>
  `,
})
export class CreateProjectComponent {
  image: string;
  projectName: string;
  projectGoal: string;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService) {
  }

  createProject(teamID: string, projectName: string) {
    projectName = projectName.toUpperCase();
    var projectID = this.db.list('ids/').push(true).key;
    this.db.object('projectTeams/'+projectID+'/'+teamID).update({member: true, leader: true});
    this.db.object('projects/'+projectID).update({name: projectName, goal: this.projectGoal, image: this.image});
    this.router.navigate(['team',teamID]);
  }

}

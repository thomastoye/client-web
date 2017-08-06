import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'createProject',
  template: `
  <div class="sheet">
  <div style="float: left; width: 50%;">
  <input maxlength="50" [(ngModel)]="projectName" style="text-transform: uppercase;" placeholder="Enter project name *" />
  <input maxlength="140" [(ngModel)]="projectGoal" placeholder="Enter project goal *" />
  <input maxlength="500" [(ngModel)]="photoURL" placeholder="Paste image from the web *" />
  <button style="background-color:#c69b00" (click)="createProject(currentTeamID, projectName)">Create project</button>
  </div>
  <div style="float: right; width: 50%;">
  <img (error)="errorHandler($event)"[src]="this.photoURL" style="object-fit:contain; height:200px; width:100%" routerLink="/user" routerLinkActive="active">
  </div>
  </div>
  `,
})
export class CreateProjectComponent {
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  photoURL: string;
  projectName: string;
  projectGoal: string;
  currentTeamID: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
        this.db.object('userInterface/'+auth.uid).subscribe(userInterface => {
          this.currentTeamID = userInterface.currentTeam;
        });
      }
    });
  }

  createProject(teamID: string, projectName: string) {
    projectName = projectName.toUpperCase();
    var projectID = this.db.list('ids/').push(true).key;
    this.db.object('projectTeams/'+projectID+'/'+teamID).update({member: true, leader: true});
    this.db.object('projects/'+projectID).update({name: projectName, goal: this.projectGoal, photoURL: this.photoURL});
    this.db.object('teamProjects/'+teamID+'/'+projectID).update({following: true});
    this.router.navigate(['projects']);
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'createTeam',
  template: `
  <div class="sheet">
  <div class="title">New team</div>
  <div style="font-size:10px;padding:10px;color:#888">Select a template for your new team (name and image can be changed later)</div>
  <ul class="listLight">
    <li *ngFor="let team of teamTemplates | async"
    [class.selected]="team.$key === selectedTeamID"
    (click)="selectedTeamID=team.$key;name=team.name;photoURL=team.photoURL"
    style="text-align:center;padding:10px;float:left">
      <img [src]="team.photoURL" style="display: inline;opacity: 1;object-fit:cover;height:100px;width:140px;border-radius:3px">
      <div style="line-height:normal">{{team.name}}</div>
      <div style="height:30px">
      <div class="buttonDiv" *ngIf="name!=null&&photoURL!=null&&team.$key===selectedTeamID" (click)="createNewTeam()">Create team</div>
      </div>
    </li>
  </ul>
  </div>
  `,
})
export class CreateTeamComponent {
  photoURL: string;
  name: string;
  teamTemplates: FirebaseListObservable<any>;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService) {
    this.teamTemplates=db.list('appSettings/teamTemplates', {
      query:{
        orderByChild:'name',
      }
    });
  }

  createNewTeam() {
    this.name = this.name.toUpperCase();
    var teamID = this.db.list('ids/').push(true).key;
    const now = Date.now();
    this.db.list('teams/'+teamID).push({
      user:this.UI.currentUser,
      name:this.name,
      photoURL:this.photoURL,
      addLeader:this.UI.currentUser,
      timestamp:firebase.database.ServerValue.TIMESTAMP,
    });
    this.db.object('userTeams/'+this.UI.currentUser+'/'+teamID).update({
      following:true,
      lastChatVisitTimestamp:now,
      lastChatVisitTimestampNegative:-1*now,
    });
    this.router.navigate(['team',teamID]);
  }

}

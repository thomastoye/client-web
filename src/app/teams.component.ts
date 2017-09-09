import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'teams',
  template: `
  <div class='sheet'>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
      [class.selected]="team.$key === currentTeamID"
      (click)="db.object('userInterface/'+currentUserID).update({currentTeam: team.$key});">
      <div style="display: inline; float: left; height:25px; width:20px">
      <div class="activity" [hidden]="!getChatActivity(team.$key)"></div>
      </div>
      <img (error)="errorHandler($event)"[src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:35px; width:35px">
      <div style="width:15px;height:15px;float:left;">{{getUserLeader(team.$key)?"*":""}}</div>
      <div style="width:200px;height:15px;float:left;">{{getTeamName(team.$key)}}</div>
      <div [hidden]='team.$key!=currentTeamID' style="float:right">
      <div class="button" style="width:30px;border:none;font-size:15px" (click)="moreButtons=!moreButtons">...</div>
      </div>
      <div [hidden]='team.$key!=currentTeamID' style="float:right">
      <div [hidden]='!moreButtons'>
      <div [hidden]='getUserLeader(team.$key)' class="button" (click)="leaveTeam(currentTeamID)">Stop following</div>
      </div>
      </div>
    </li>
  </ul>
  <button (click)="this.router.navigate(['followTeam'])">Follow a team</button>
  <button (click)="this.router.navigate(['createTeam'])">Create a new team</button>
  </div>
  `,
})

export class TeamsComponent  {

  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  moreButtons: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.moreButtons = false;
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){
        this.userTeams=null;
      }
      else {
        this.currentUserID = auth.uid;
        this.currentUser = db.object('users/' + (auth ? auth.uid : "logedout"));
        db.object('userInterface/'+auth.uid).subscribe(userInterface => {
          this.currentTeamID = userInterface.currentTeam;
          this.currentTeam = db.object('teams/' + this.currentTeamID);
        });
        this.userTeams = db.list('userTeams/' + (auth ? auth.uid : "logedout"), {
          query:{
            orderByChild:'following',
            equalTo: true,
          }
        });
      }
    });
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

  getUserLeader (ID: string) :string {
    var output;
    this.db.object('teamUsers/' + ID + '/' + this.currentUserID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  getChatActivity (ID: string) :boolean {
    var output = false;
    this.db.object('userTeams/' + this.currentUserID + '/' + ID).subscribe(userTeam => {
      this.db.object('teamActivities/' + ID).subscribe(teamActivities => {
        output = teamActivities.lastMessageTimestamp > userTeam.lastChatVisitTimestamp;
      });
    });
    return output;
  }

  leaveTeam(teamID: string) {
    this.db.object('userTeams/'+this.currentUserID+'/'+teamID).update({following:false});
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

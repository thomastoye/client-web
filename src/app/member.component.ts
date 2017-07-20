import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'member',
  template: `
  <ul class="members" style="float: left">
    <li class='icon' *ngFor="let user of teamUsers | async">
      <img [src]="getPhotoURL(user.$key)" (click)="db.object('userInterface/'+currentUserID).update({focusUser: user.$key})" style="border-radius:3px; object-fit: cover; height:45px; width:45px" routerLink="/userProfile" routerLinkActive="active">
      <div style="font-size: 9px; color: #FFF;">{{ getFirstName(user.$key) }}{{ (user.leader? " *" : "") }}{{getUserFollowing(user.$key,this.currentTeamID)?"":" (NF)"}}</div>
    </li>
  </ul>
`,
})
export class MemberComponent  {

  currentUserID: string;
  currentTeamID: string;
  teamUsers: FirebaseListObservable<any>;
  newMemberID: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){
        this.teamUsers = null;
      }
      else {
        this.currentUserID = auth.uid;
        this.db.object('userInterface/'+auth.uid+'/currentTeam').subscribe(currentTeam => {
          this.currentTeamID = currentTeam.$value;
          this.teamUsers = this.db.list('teamUsers/' + currentTeam.$value, {
            query:{
              orderByChild:'member',
              equalTo: true,
            }
          });
        });
      }
    });
  }

  getFirstName (ID: string) :string {
    var output;
    if (ID == this.currentUserID) { output = "me"} else {
      this.db.object('users/' + ID).subscribe(snapshot => {
        output = snapshot.firstName;
      });
    }
    return output;
  }

  getUserFollowing (userID: string, teamID: string) :boolean {
    var output;
    this.db.object('userTeams/' + userID + '/' + teamID).subscribe(snapshot => {
      output = snapshot.following
    });
    return output;
  }

  getPhotoURL (ID: string) :string {
    var output;
    this.db.object('users/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

}

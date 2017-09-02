import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router, NavigationEnd } from '@angular/router'

@Component({
  selector: 'users',
  template: `
  <div class='sheet'>
    <div style="float: left;">
      <ul class='listLight'>
        <li class='userIcon' *ngFor="let user of teamUsers | async" (click)="db.object('userInterface/'+currentUserID).update({focusUser: user.$key});router.navigate(['userProfile'])">
          <img (error)="errorHandler($event)"[src]="getPhotoURL(user.$key)" style="border-radius:3px; object-fit: cover; height:60px; width:60px">
          <div>{{ getFirstName(user.$key) }}{{ (user.leader? " *" : "") }}{{getUserFollowing(user.$key,currentTeamID)?"":" (Not Following)"}}</div>
        </li>
      </ul>
    </div>
    <div style="float: right;">
      <ul class='listLight' [hidden]='!getUserLeader(currentTeamID)'>
        <li (click)="this.router.navigate(['addMember'])">
          <div class='cornerButton' style="float:right">+</div>
        </li>
        <li (click)="db.object('teamAds/'+currentTeamID).update({memberAdVisible:!memberAdVisible})">
          <div class='cornerButton' style="float:right">Ad</div>
        </li>
      </ul>
    </div>
    <div style="clear:left">
      <textarea [hidden]='!memberAdVisible' class="textAreaAdvert" style="max-width:400px" rows="10" maxlength="500" [(ngModel)]="memberAdText" (keyup)="updateMemberAdDB()" placeholder="Looking for new Members or Leaders for your team? Write an advert here."></textarea>
      <div style="text-align:left; cursor:pointer; color:blue; padding:10px;" (click)="router.navigate(['teamAds'])">View all Ads</div>
    </div>
  </div>
`,
})
export class UsersComponent  {

  currentUserID: string;
  currentTeamID: string;
  teamUsers: FirebaseListObservable<any>;
  newMemberID: string;
  memberAdText: string;
  memberAdVisible: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      this.memberAdVisible=false;
      if (auth==null){
        this.teamUsers = null;
      }
      else {
        this.currentUserID = auth.uid;
        this.db.object('userInterface/'+auth.uid+'/currentTeam').subscribe(currentTeam => {
          this.currentTeamID = currentTeam.$value;
          this.db.object('teamAds/'+this.currentTeamID+'/memberAdText').subscribe(memberAdText => {
            this.memberAdText = memberAdText.$value;
          });
          this.db.object('teamAds/'+this.currentTeamID+'/memberAdVisible').subscribe(memberAdVisible => {
            this.memberAdVisible = memberAdVisible.$value;
          });
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

  getUserLeader (ID: string) :string {
    var output;
    this.db.object('teamUsers/' + ID + '/' + this.currentUserID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  updateMemberAdDB () {
    this.db.object('teamAds/'+this.currentTeamID).update({
      memberAdText:this.memberAdText,
      memberAdTimestamp:firebase.database.ServerValue.TIMESTAMP,
    });
  }

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

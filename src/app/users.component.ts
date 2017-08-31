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
        <li class='icon' (click)="this.router.navigate(['addMember'])">
          <div style="border-style:solid;border-width:thin;line-height:35px;font-size:20px;text-align:center;display:inline;float:right;margin: 0 10px 0 10px;opacity:1;border-radius:20px;object-fit:cover;height:40px;width:40px">+</div>
        </li>
        <li class='icon' (click)="db.object('teamAds/'+currentTeamID).update({memberAdVisible:!memberAdVisible})">
          <div style="border-style:solid;border-width:thin;line-height:35px;font-size:20px;text-align:center;display:inline;float:right;margin: 0 10px 0 10px;opacity:1;border-radius:20px;object-fit:cover;height:40px;width:40px">Ad</div>
        </li>
      </ul>
    </div>
    <div [hidden]='!memberAdVisible' style="clear:left">
      <textarea class="textAreaAdvert" style="max-width:400px" rows="12" maxlength="500" [(ngModel)]="memberAdText" (keyup)="db.object('teamAds/'+currentTeamID).update({memberAdText:memberAdText})" placeholder="Looking for new Members or Leaders for your team? Write an advert here."></textarea>
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

  errorHandler(event) {
    event.target.src = "https://cdn.browshot.com/static/images/not-found.png";
  }

}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'createTransaction',
  template: `
  <div class="user">
  <input maxlength="500" [(ngModel)]="this.transactionReference" placeholder="Enter reference" />
  <input maxlength="500" type="number" min="1" [(ngModel)]="this.transactionAmount" placeholder="Enter amount" />
  <button (click)="switchTransactionType()">{{transactionType}}</button>
  <ul class="listDark">
    <li *ngFor="let team of userTeams | async"
    [class.selected]="team.$key === selectedTeamID"
    (click)="selectedTeamID = team.$key">
      <img [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
      {{getTeamName(team.$key)}}{{ (getUserLeader(team.$key)? " *" : "")}}
    </li>
  </ul>
  <button (click)="createTransaction()">Confirm transaction</button>
  </div>
  `,
})
export class CreateTransactionComponent {
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  photoURL: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  transactionReference: string;
  transactionAmount: number;
  selectedTeamID: string;
  transactionType: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){
        this.userTeams=null;
      }
      else {
        db.object('userInterface/'+auth.uid).subscribe( userInterface => {
          this.transactionType = "Send to"
          this.currentUserID = auth.uid;
          this.currentTeamID = userInterface.currentTeam;
          this.userTeams = db.list('userTeams/'+auth.uid, {
            query:{
              orderByChild:'following',
              equalTo: true,
            }
          });
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

  switchTransactionType () {
      if (this.transactionType == "Send to") {this.transactionType = "Receive from"}
      else {this.transactionType = "Send to"}
  }

  createTransaction() {
    this.db.list('teamTransactions/' + this.currentTeamID).push({reference: this.transactionReference, type: this.transactionType, amount: this.transactionAmount, otherTeam: this.selectedTeamID, createdTimestamp: firebase.database.ServerValue.TIMESTAMP, status: "pending"})
    this.router.navigate(['wallet']);
  }

}

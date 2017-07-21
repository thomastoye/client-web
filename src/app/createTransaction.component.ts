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
  <input maxlength="50" [(ngModel)]="this.transactionReference" placeholder="Reference" />
  <input maxlength="500" type="number" onkeypress="return event.charCode>=48" [(ngModel)]="this.transactionAmount" placeholder="Amount" />
  <ul class="listDark">
    <li *ngFor="let team of userTeams | async"
    [class.selected]="team.$key === selectedTeamID"
    (click)="selectedTeamID = team.$key">
      <img [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
      {{getTeamName(team.$key)}}{{ (getUserLeader(team.$key)? " *" : "")}}
    </li>
  </ul>
  <button (click)="createTransaction()">Confirm transaction {{messageCreateTransaction}}</button>
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
  messageCreateTransaction: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){
        this.userTeams=null;
      }
      else {
        db.object('userInterface/'+auth.uid).subscribe( userInterface => {
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
    this.db.object('teamUsers/'+ID+'/'+this.currentUserID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  createTransaction() {
    this.db.list('teamTransactions/'+this.currentTeamID).push({reference: this.transactionReference, amount: this.transactionAmount, receiver: this.selectedTeamID, createdTimestamp: firebase.database.ServerValue.TIMESTAMP, status: "pending"})
    .then(_ => this.router.navigate(['wallet']))
    .catch(err => this.messageCreateTransaction="Error: Only a leader can create a transaction");
  }

}

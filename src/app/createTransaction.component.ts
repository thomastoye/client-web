import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'createTransaction',
  template: `
  <div class="titleSeperator" style="color: black;text-align:left;">
    <div >Available balance {{currentBalance | number:'1.2-2'}} COINS</div>
  </div>
  <div class="user">
  <input maxlength="50" (keyup)="checkTransactionInput()" [(ngModel)]="this.transactionReference" placeholder="Reference *" />
  <input maxlength="500" type="number" onkeypress="return event.charCode>=48" (keyup)="checkTransactionInput()" [(ngModel)]="this.transactionAmount" placeholder="Amount *" />
  <ul class="listDark">
    <div class="title">SELECT RECEIVING TEAM</div>
    <li *ngFor="let team of userTeams | async"
    [class.selected]="team.$key === selectedTeamID"
    (click)="selectedTeamID = team.$key;checkTransactionInput()">
      <img [src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:25px; width:25px">
      {{getTeamName(team.$key)}}{{ (getUserLeader(team.$key)? " *" : "")}}
    </li>
  </ul>
  <button [hidden]='!transactionInputValid' (click)="createTransaction()">Confirm transaction {{messageCreateTransaction}}</button>
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
  currentBalance: number;
  transactionInputValid: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.transactionInputValid = false;
    this.currentBalance = 0;
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){
        this.userTeams=null;
      }
      else {
        db.object('userInterface/'+auth.uid).subscribe( userInterface => {
          this.currentUserID = auth.uid;
          this.currentTeamID = userInterface.currentTeam;
          this.getTeamWalletBalance(this.currentTeamID).then(balance=>{
            this.currentBalance = Number(balance);
          });
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

  getTeamWalletBalance (teamID:string) {
    return new Promise(function (resolve, reject) {
      var balance=0;
      firebase.database().ref('PERRINNTransactions/').orderByChild('sender').equalTo(teamID).once('value').then(PERRINNTransactions=>{
        PERRINNTransactions.forEach(transaction=>{
          balance=balance-transaction.val().amount;
        });
      });
      firebase.database().ref('PERRINNTransactions/').orderByChild('receiver').equalTo(teamID).once('value').then(PERRINNTransactions=>{
        PERRINNTransactions.forEach(transaction=>{
          balance=balance+transaction.val().amount;
        });
        resolve (balance);
      });
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
    this.db.list('teamTransactions/'+this.currentTeamID).push({
      reference: this.transactionReference,
      amount: this.transactionAmount,
      receiver: this.selectedTeamID,
      createdTimestamp: firebase.database.ServerValue.TIMESTAMP,
      status: "pending"
    })
    .then(_ => this.router.navigate(['wallet']))
    .catch(err => this.messageCreateTransaction="Error: Only a leader can create a transaction");
  }

  checkTransactionInput():void {
    this.transactionInputValid = (this.transactionReference!=null&&this.transactionReference!=""&&
                                  this.transactionAmount!=null&&this.transactionAmount!=0&&
                                  this.transactionAmount<=this.currentBalance&&
                                  this.selectedTeamID!=null&&this.selectedTeamID!=""&&
                                  this.selectedTeamID!=this.currentTeamID);
  }

}

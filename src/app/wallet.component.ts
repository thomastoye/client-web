import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'wallet',
  template: `
  <div class="titleSeperator">
    <div>
    <img src="./../assets/App icons/icon_share_03.svg" style="width:60px">
    </div>
    <div>
    <div style="float: left; width: 50%; text-align: right; padding: 5px">
    <div style="font-size: 30px; color: black;">{{currentBalance | number:'1.2-2'}}</div>
    </div>
    <div style="float: right; width: 50%; text-align: left; padding: 5px">
    <div style="color: black;">COINS</div>
    </div>
    </div>
  </div>
  <ul class="listDark">
    <div class="title">CONFIRMED TRANSACTIONS IN</div>
    <li *ngFor="let transaction of perrinnTransactionsIn | async">
      {{transaction.createdTimestamp | date :'medium'}}
      {{transaction.amount | number:'1.2-2'}}
      {{transaction.reference}}
      {{getTeamName(transaction.receiver)}}
      {{transaction.status}}
    </li>
    <div class="title">CONFIRMED TRANSACTIONS OUT</div>
    <li *ngFor="let transaction of perrinnTransactionsOut | async">
    {{transaction.createdTimestamp | date :'medium'}}
    {{transaction.amount | number:'1.2-2'}}
    {{transaction.reference}}
    {{getTeamName(transaction.receiver)}}
    {{transaction.status}}
    </li>
    <div class="title">PENDING TRANSACTIONS</div>
    <li *ngFor="let transaction of teamTransactions | async"
    [class.selected]="transaction.$key === selectedTransactionID"
    (click)="selectedTransactionID = transaction.$key; clearAllMessages()">
    {{transaction.createdTimestamp | date :'medium'}}
    {{transaction.amount | number:'1.2-2'}}
    {{transaction.reference}}
    {{getTeamName(transaction.receiver)}}
    {{transaction.status}}
    </li>
  </ul>
  <button (click)="this.router.navigate(['createTransaction'])">New transaction</button>
  <button (click)="cancelTransaction(currentTeamID, selectedTransactionID)" style="color:red">Cancel this pending transaction {{messageCancelTransaction}}</button>
  `,
})
export class WalletComponent {

teamTransactions: FirebaseListObservable<any>;
perrinnTransactionsOut: FirebaseListObservable<any>;
perrinnTransactionsIn: FirebaseListObservable<any>;
currentBalance: number;
messageCancelTransaction: string;
selectedTransactionID: string;
currentTeamID: string;

constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
  this.currentBalance = 0;
  this.afAuth.authState.subscribe((auth) => {
    if (auth==null){
      this.teamTransactions=null;
      this.perrinnTransactionsOut=null;
      this.perrinnTransactionsIn=null;
    }
    else {
      db.object('userInterface/'+auth.uid+'/currentTeam').subscribe( currentTeamID => {
        this.currentTeamID = currentTeamID.$value;
        this.teamTransactions = db.list('teamTransactions/'+currentTeamID.$value, {
          query:{
            orderByChild:'status',
            equalTo: "pending",
          }
        });
        this.perrinnTransactionsOut = db.list('perrinnTransactions/', {
          query:{
            orderByChild:'sender',
            equalTo: currentTeamID.$value,
          }
        });
        this.perrinnTransactionsIn = db.list('perrinnTransactions/', {
          query:{
            orderByChild:'receiver',
            equalTo: currentTeamID.$value,
          }
        });
        this.perrinnTransactionsOut.subscribe(perrinnTransactionsOut=>{
          perrinnTransactionsOut.forEach(perrinnTransactionOut=>{
            this.currentBalance = this.currentBalance - perrinnTransactionOut.amount
          });
        });
        this.perrinnTransactionsIn.subscribe(perrinnTransactionsIn=>{
          perrinnTransactionsIn.forEach(perrinnTransactionIn=>{
            this.currentBalance = this.currentBalance + perrinnTransactionIn.amount
          });
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

cancelTransaction (teamID: string, transactionID: string) {
  this.db.object('teamTransactions/'+teamID+'/'+transactionID).update({status: "cancelled"})
  .then(_ => this.messageCancelTransaction="Success: Transaction has been cancelled")
  .catch(err => this.messageCancelTransaction="Error: Only a leader can cancel a transaction");
}

clearAllMessages () {
  this.messageCancelTransaction = "";
}

}

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
    <div class="title">CONFIRMED TRANSACTIONS</div>
    <li *ngFor="let transaction of PERRINNTeamTransactions | async">
      <div style="width:200px; float:left">{{transaction.createdTimestamp | date :'medium'}}</div>
      <div style="width:100px; float:left; text-align:right">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:200px; float:left; text-align:right">{{transaction.reference}}</div>
      <div style="width:200px; float:left; text-align:right">{{getTeamName(transaction.sender)}}</div>
    </li>
    <div class="title">PENDING TRANSACTIONS</div>
    <li *ngFor="let transaction of teamTransactions | async"
    [class.selected]="transaction.$key === selectedTransactionID"
    (click)="selectedTransactionID = transaction.$key; clearAllMessages()">
      <div style="width:200px; float:left; text-align:right">{{transaction.createdTimestamp | date :'medium'}}</div>
      <div style="width:200px; float:left; text-align:right">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:200px; float:left; text-align:right">{{transaction.reference}}</div>
      <div style="width:200px; float:left; text-align:right">{{getTeamName(transaction.receiver)}}</div>
    </li>
  </ul>
  <div style="width: 250px;">
  <button (click)="this.router.navigate(['createTransaction'])">New transaction</button>
  <button (click)="cancelTransaction(currentTeamID, selectedTransactionID)" style="background:#e04e4e">Cancel this pending transaction {{messageCancelTransaction}}</button>
  </div>
  `,
})
export class WalletComponent {

teamTransactions: FirebaseListObservable<any>;
PERRINNTeamTransactions: FirebaseListObservable<any>;
currentBalance: number;
messageCancelTransaction: string;
selectedTransactionID: string;
currentTeamID: string;

constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
  this.currentBalance = 0;
  this.afAuth.authState.subscribe((auth) => {
    if (auth==null){
      this.teamTransactions=null;
      this.PERRINNTeamTransactions=null;
    }
    else {
      if (auth.uid=="QYm5NATKa6MGD87UpNZCTl6IolX2") {this.verifyAllTransactionsPERRINN()}
      db.object('userInterface/'+auth.uid+'/currentTeam').subscribe( currentTeamID => {
        this.currentTeamID = currentTeamID.$value;
        this.teamTransactions = db.list('teamTransactions/'+currentTeamID.$value, {
          query:{orderByChild:'status',equalTo: "pending"}
        });
        this.PERRINNTeamTransactions = db.list('PERRINNTeamTransactions/'+currentTeamID.$value);
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

verifyAllTransactionsPERRINN () {
  firebase.database().ref('teamTransactions/').once('value').then(teamTransactions=> {
    teamTransactions.forEach(team=>{
      team.forEach(transaction=>{
        if (transaction.val().status == "pending") {
          console.log("New transaction");
          console.log(transaction.key);
          console.log(team.key);
          console.log(transaction.val().receiver);
          console.log(transaction.val().amount);
          console.log(transaction.val().status);
          firebase.database().ref('PERRINNTeamTransactions/'+team.key).once('value').then(teamTransactions=> {

          });
        }
      });
    });
  });
}

}

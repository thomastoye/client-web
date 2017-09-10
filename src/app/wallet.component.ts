import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'wallet',
  template: `
  <div class="sheet">
    <div style="text-align:center">
    <img (error)="errorHandler($event)" src="./../assets/App icons/icon_share_03.svg" style="width:60px">
    </div>
    <div>
    <div style="float: left; width: 50%; text-align: right; padding: 5px">
    <div style="font-size: 25px;line-height:normal; color: black;">{{currentBalance | number:'1.2-2'}}</div>
    </div>
    <div style="float: right; width: 50%; text-align: left; padding: 5px">
    <button type="button" (click)="router.navigate(['buyCoins'])" style="margin:0;float:right;width:100px;background-color:#43c14b">Buy COINS</button>
    <div style="color: black;">COINS</div>
    </div>
    <div style="text-align:right; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="router.navigate(['COINinfo'])">COIN info</div>
    </div>
    <button [hidden]='!getUserMember(currentTeamID)' (click)="this.router.navigate(['createTransaction'])">Send COINS</button>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">RECEIVED</div>
  <ul class="listLight">
    <li *ngFor="let transaction of PERRINNTransactionsIN | async">
      <div style="width:170px; float:left; text-align:right">{{transaction.verifiedTimestamp | date :'medium'}}</div>
      <div style="width:170px; float:left; text-align:right">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:170px; float:left; text-align:right">{{transaction.reference}}</div>
      <div style="width:170px; float:left; text-align:right">From {{getTeamName(transaction.sender)}}</div>
      <div style="width:170px; float:left; text-align:right">Verified in {{(transaction.verifiedTimestamp-transaction.createdTimestamp)/1000}} s</div>
    </li>
    </ul>
    </div>
    <div class='sheet' style="margin-top:10px">
    <div class="title">SENT</div>
    <ul class="listLight">
    <li *ngFor="let transaction of PERRINNTransactionsOUT | async">
      <div style="width:170px; float:left; text-align:right">{{transaction.verifiedTimestamp | date :'medium'}}</div>
      <div style="width:170px; float:left; text-align:right">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:170px; float:left; text-align:right">{{transaction.reference}}</div>
      <div style="width:170px; float:left; text-align:right">To {{getTeamName(transaction.receiver)}}</div>
      <div style="width:170px; float:left; text-align:right">Verified in {{(transaction.verifiedTimestamp-transaction.createdTimestamp)/1000}} s</div>
    </li>
    </ul>
    </div>
    <div class='sheet' style="margin-top:10px">
    <div class="title">PENDING</div>
    <ul class="listLight">
    <li *ngFor="let transaction of teamTransactions | async"
    [class.selected]="transaction.$key === selectedTransactionID"
    (click)="selectedTransactionID = transaction.$key; clearAllMessages()">
      <div style="width:170px; float:left; text-align:right">{{transaction.createdTimestamp | date :'medium'}}</div>
      <div style="width:170px; float:left; text-align:right">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:170px; float:left; text-align:right">{{transaction.reference}}</div>
      <div style="width:170px; float:left; text-align:right">To {{getTeamName(transaction.receiver)}}</div>
      <div style="float:right">
      <div class="button" style="width:30px;border:none;font-size:15px" (click)="moreButtons=!moreButtons">...</div>
      </div>
      <div style="float:right">
      <div [hidden]='!moreButtons'>
      <div class="button" (click)="cancelTransaction(currentTeamID, selectedTransactionID)">Cancel</div>
      </div>
      </div>
    </li>
    </ul>
    </div>
    <div class='sheet' style="margin-top:10px">
    <div class="title">AWAITING LEADER ACTION</div>
    <ul class="listLight">
    <li *ngFor="let transaction of teamTransactionRequests | async"
    [class.selected]="transaction.$key === selectedTransactionRequestID"
    (click)="selectedTransactionRequestID = transaction.$key; clearAllMessages()">
      <div style="width:170px; float:left; text-align:right">{{transaction.requestedTimestamp | date :'medium'}}</div>
      <div style="width:170px; float:left; text-align:right">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:170px; float:left; text-align:right">{{transaction.reference}}</div>
      <div style="width:170px; float:left; text-align:right">To {{getTeamName(transaction.receiver)}}</div>
      <div style="float:right">
      <div class="button" style="width:30px;border:none;font-size:15px" (click)="moreButtons=!moreButtons">...</div>
      </div>
      <div style="float:right">
      <div [hidden]='!moreButtons'>
      <div class="button" (click)="cancelTransactionRequest(currentTeamID, selectedTransactionRequestID)">Cancel</div>
      <div class="button" [hidden]='!isUserLeader' (click)="approveTransactionRequest(currentTeamID, selectedTransactionRequestID)">Approve</div>
      </div>
      </div>
    </li>
  </ul>
  </div>
  `,
})
export class WalletComponent {

teamTransactions: FirebaseListObservable<any>;
teamTransactionRequests: FirebaseListObservable<any>;
PERRINNTransactionsOUT: FirebaseListObservable<any>;
PERRINNTransactionsIN: FirebaseListObservable<any>;
currentBalance: number;
message: string;
selectedTransactionID: string;
selectedTransactionRequestID: string;
currentTeamID: string;
moreButtons: boolean;
currentUserID: string;
isUserLeader: boolean;

constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
  this.moreButtons = false;
  this.currentBalance = 0;
  this.afAuth.authState.subscribe((auth) => {
    if (auth==null){
      this.teamTransactions=null;
      this.teamTransactionRequests=null;
      this.PERRINNTransactionsOUT=null;
      this.PERRINNTransactionsIN=null;
      this.isUserLeader = false;
    }
    else {
      this.currentUserID = auth.uid;
      db.object('userInterface/'+auth.uid+'/currentTeam').subscribe( currentTeamID => {
        this.currentTeamID = currentTeamID.$value;
        this.getTeamWalletBalance(this.currentTeamID).then(balance=>{
          this.currentBalance = Number(balance);
        });
        this.db.object('teamUsers/'+this.currentTeamID+'/'+this.currentUserID).subscribe(user => {
          this.isUserLeader = user.leader;
        });
        this.teamTransactions = db.list('teamTransactions/'+currentTeamID.$value, {
          query:{orderByChild:'status',equalTo: "pending"}
        });
        this.teamTransactionRequests = db.list('teamTransactionRequests/'+currentTeamID.$value, {
          query:{orderByChild:'status',equalTo: "pending"}
        });
        this.PERRINNTransactionsOUT = db.list('PERRINNTransactions/',{query:{orderByChild:'sender',equalTo:this.currentTeamID}});
        this.PERRINNTransactionsIN = db.list('PERRINNTransactions/',{query:{orderByChild:'receiver',equalTo:this.currentTeamID}});
      });
    }
  });
}

getTeamWalletBalance (teamID:string) {
  return new Promise(function (resolve, reject) {
    var balance=0;
    firebase.database().ref('PERRINNTransactions/').orderByChild('sender').equalTo(teamID).once('value').then(PERRINNTransactions=>{
      PERRINNTransactions.forEach(transaction=>{
        balance-=Number(transaction.val().amount);
      });
    });
    firebase.database().ref('PERRINNTransactions/').orderByChild('receiver').equalTo(teamID).once('value').then(PERRINNTransactions=>{
      PERRINNTransactions.forEach(transaction=>{
        balance+=Number(transaction.val().amount);
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

cancelTransaction (teamID: string, transactionID: string) {
  this.db.object('teamTransactions/'+teamID+'/'+transactionID).update({
    status: "cancelled",
    cancelledTimestamp: firebase.database.ServerValue.TIMESTAMP
  })
  .then(_ => this.message="Success")
  .catch(err => this.message="Error");
}

cancelTransactionRequest (teamID: string, transactionID: string) {
  this.db.object('teamTransactionRequests/'+teamID+'/'+transactionID).update({
    status: "cancelled",
    cancelledTimestamp: firebase.database.ServerValue.TIMESTAMP
  })
  .then(_ => this.message="Success")
  .catch(err => this.message="Error");
}

approveTransactionRequest (teamID: string, transactionID: string) {
  firebase.database().ref('teamTransactionRequests/'+teamID+'/'+transactionID).once('value').then(transaction=>{
    this.db.object('teamTransactions/'+teamID+'/'+transactionID).update({
      reference: transaction.val().reference,
      amount: transaction.val().amount,
      receiver: transaction.val().receiver,
      requestedTimestamp: transaction.val().requestedTimestamp,
      createdTimestamp: firebase.database.ServerValue.TIMESTAMP,
      status: "pending"
    })
    .then(_ =>{
      this.db.object('teamTransactionRequests/'+teamID+'/'+transactionID).update({
        status: "approved",
        approvedTimestamp: firebase.database.ServerValue.TIMESTAMP
      })
      .then(_ => this.message="Success")
      .catch(err => this.message="Error");
    })
    .catch(err => this.message="Error");
  });
}

clearAllMessages () {
  this.message = "";
}

getUserMember (ID: string) :boolean {
  var output;
  this.db.object('teamUsers/' + ID + '/' + this.currentUserID).subscribe(snapshot => {
    output = snapshot.member;
  });
  return output;
}

errorHandler(event) {
  event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
}

}

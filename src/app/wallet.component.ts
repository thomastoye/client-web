import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router, ActivatedRoute } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'wallet',
  template: `
  <div class="sheet">
    <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(UI.currentTeam)" (click)="router.navigate(['team',UI.currentTeam])" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:40px;width:60px;cursor:pointer">
    <div style="clear:both;text-align:center">
    <img (error)="errorHandler($event)" src="./../assets/App icons/icon_share_03.svg" style="width:60px">
    </div>
    <div>
    <div style="text-align:center;font-size:18px;font-family:sans-serif;">{{DB.getTeamName(UI.currentTeam)}}</div>
    <div style="float: left; width: 50%; text-align: right; padding: 5px">
    <div style="font-size: 25px;line-height:normal; color: black;">{{DB.getTeamBalance(UI.currentTeam)?DB.getTeamBalance(UI.currentTeam):0 | number:'1.2-2'}}</div>
    </div>
    <div style="float: right; width: 50%; text-align: left; padding: 5px">
    <div style="color: black;">COINS</div>
    </div>
    </div>
    <button [hidden]='!DB.getUserMember(UI.currentTeam,UI.currentUser)' (click)="this.router.navigate(['createTransaction'])" style="width:100px;float:left">Send COINS</button>
    <button type="button" (click)="router.navigate(['buyCoins'])" style="float:left;width:100px;background-color:#43c14b">Buy COINS</button>
    <div style="text-align:right; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="router.navigate(['COINinfo'])">COIN info</div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div class="title">RECEIVED</div>
  <ul class="listLight">
    <li *ngFor="let transaction of PERRINNTransactionsIN | async">
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.verifiedTimestamp | date :'medium'}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:13px;line-height:13px">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.reference}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">From {{DB.getTeamName(transaction.sender)}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">Verified in {{(transaction.verifiedTimestamp-transaction.createdTimestamp)/1000}} s</div>
    </li>
    </ul>
    </div>
    <div class='sheet' style="margin-top:10px">
    <div class="title">SENT</div>
    <ul class="listLight">
    <li *ngFor="let transaction of PERRINNTransactionsOUT | async">
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.verifiedTimestamp | date :'medium'}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:13px;line-height:13px">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.reference}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">To {{DB.getTeamName(transaction.receiver)}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">Verified in {{(transaction.verifiedTimestamp-transaction.createdTimestamp)/1000}} s</div>
    </li>
    </ul>
    </div>
    <div class='sheet' style="margin-top:10px">
    <div class="title">PENDING</div>
    <ul class="listLight">
    <li *ngFor="let transaction of teamTransactions | async"
    [class.selected]="transaction.$key === selectedTransactionID"
    (click)="selectedTransactionID = transaction.$key; clearAllMessages()">
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.createdTimestamp | date :'medium'}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:13px;line-height:13px">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.reference}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">To {{DB.getTeamName(transaction.receiver)}}</div>
      <div style="float:right">
      <div class="button" style="width:30px;border:none;font-size:15px" (click)="moreButtons=!moreButtons">...</div>
      </div>
      <div style="float:right">
      <div [hidden]='!moreButtons'>
      <div class="button" (click)="cancelTransaction(UI.currentTeam, selectedTransactionID)">Cancel</div>
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
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.requestedTimestamp | date :'medium'}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:13px;line-height:13px">{{transaction.amount | number:'1.2-2'}} COINS</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.reference}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">To {{DB.getTeamName(transaction.receiver)}}</div>
      <div style="float:right">
      <div class="button" style="width:30px;border:none;font-size:15px" (click)="moreButtons=!moreButtons">...</div>
      </div>
      <div style="float:right">
      <div [hidden]='!moreButtons'>
      <div class="button" (click)="cancelTransactionRequest(UI.currentTeam, selectedTransactionRequestID)">Cancel</div>
      <div class="button" [hidden]='!DB.getUserLeader(UI.currentTeam,UI.currentUser)' (click)="approveTransactionRequest(UI.currentTeam, selectedTransactionRequestID)">Approve</div>
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
message: string;
selectedTransactionID: string;
selectedTransactionRequestID: string;
moreButtons: boolean;

constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
  this.route.params.subscribe(params => {
    this.UI.currentTeam=params['id'];
    this.moreButtons = false;
    this.teamTransactions = db.list('teamTransactions/'+UI.currentTeam, {
      query:{orderByChild:'status',equalTo: "pending"}
    });
    this.teamTransactionRequests = db.list('teamTransactionRequests/'+UI.currentTeam, {
      query:{orderByChild:'status',equalTo: "pending"}
    });
    this.PERRINNTransactionsOUT = db.list('PERRINNTransactions/',{query:{orderByChild:'sender',equalTo:this.UI.currentTeam}});
    this.PERRINNTransactionsIN = db.list('PERRINNTransactions/',{query:{orderByChild:'receiver',equalTo:this.UI.currentTeam}});
  });
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

errorHandler(event) {
  event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
}

}

import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'createTransaction',
  template: `
  <div class="sheet">
  <div class="title" style="color: black;text-align:left;">Available balance {{currentBalance | number:'1.2-2'}} COINS</div>
  <div class="user">
  <input maxlength="50" id="amountInput" type="number" onkeypress="return event.charCode>=48" (keyup)="checkTransactionInput()" [(ngModel)]="this.transactionAmount" placeholder="Amount *" />
  <input maxlength="50" (keyup)="checkTransactionInput()" [(ngModel)]="this.transactionReference" placeholder="Reference *" />
  <div class="title">Select receiving team</div>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
    [class.selected]="team.$key === selectedTeamID"
    (click)="selectedTeamID = team.$key;checkTransactionInput()">
      <img (error)="errorHandler($event)"[src]="DB.getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{DB.getTeamName(team.$key)}}{{ (DB.getUserLeader(team.$key,UI.currentUser)? " *" : "")}}
    </li>
  </ul>
  <button [hidden]='!transactionInputValid' (click)="createTransaction()">Confirm transaction{{DB.getUserLeader(UI.currentTeam,UI.currentUser)?"":" (Team leader will have to approve) "}}{{messageCreateTransaction}}</button>
  </div>
  </div>
  `,
})
export class CreateTransactionComponent {
  userTeams: FirebaseListObservable<any>;
  transactionReference: string;
  transactionAmount: number;
  selectedTeamID: string;
  messageCreateTransaction: string;
  currentBalance: number;
  transactionInputValid: boolean;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService, public DB: databaseService) {
    this.transactionInputValid = false;
    this.currentBalance = 0;
    this.getTeamWalletBalance(this.UI.currentTeam).then(balance=>{
      this.currentBalance = Number(balance);
    });
    this.userTeams = db.list('userTeams/'+this.UI.currentUser, {
      query:{
        orderByChild:'following',
        equalTo: true,
      }
    });
  }

  ngOnInit () {
    document.getElementById("amountInput").focus();
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

  createTransaction() {
    if (this.DB.getUserLeader(this.UI.currentTeam,this.UI.currentUser)) {
      this.db.list('teamTransactions/'+this.UI.currentTeam).push({
        reference: this.transactionReference,
        amount: this.transactionAmount,
        receiver: this.selectedTeamID,
        createdTimestamp: firebase.database.ServerValue.TIMESTAMP,
        status: "pending"
      })
      .then(_ => this.router.navigate(['wallet']))
      .catch(err => this.messageCreateTransaction="Error");
    }
    else {
      this.db.list('teamTransactionRequests/'+this.UI.currentTeam).push({
        reference: this.transactionReference,
        amount: this.transactionAmount,
        receiver: this.selectedTeamID,
        requestedTimestamp: firebase.database.ServerValue.TIMESTAMP,
        status: "pending"
      })
      .then(_ => this.router.navigate(['wallet']))
      .catch(err => this.messageCreateTransaction="Error");
    }
  }

  checkTransactionInput():void {
    this.transactionInputValid = (this.transactionReference!=null&&this.transactionReference!=""&&
                                  this.transactionAmount!=null&&this.transactionAmount>0&&
                                  this.transactionAmount<=this.currentBalance&&
                                  this.selectedTeamID!=null&&this.selectedTeamID!=""&&
                                  this.selectedTeamID!=this.UI.currentTeam);
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

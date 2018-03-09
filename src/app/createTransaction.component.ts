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
  <div style="width:100px;font-size:12px;cursor:pointer;color:blue;padding:10px;float:left" (click)="router.navigate(['chat',UI.currentTeam])">Chat</div>
  <div style="width:100px;font-size:12px;cursor:pointer;color:blue;padding:10px;float:right" (click)="router.navigate(['wallet',this.UI.currentTeam])">Wallet</div>
  <div class="title" style="color: black;text-align:left;">Available balance {{DB.getTeamBalance(this.UI.currentTeam) | number:'1.2-2'}} COINS</div>
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
  <button [hidden]='!transactionInputValid' (click)="createTransaction()">Confirm transaction</button>
  </div>
  </div>
  `,
})
export class CreateTransactionComponent {
  userTeams: FirebaseListObservable<any>;
  transactionReference: string;
  transactionAmount: number;
  selectedTeamID: string;
  transactionInputValid: boolean;

  constructor(public db: AngularFireDatabase, public router: Router,  public UI: userInterfaceService, public DB: databaseService) {
    this.transactionInputValid = false;
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

  createTransaction() {
    const now = Date.now();
    this.db.list('teamMessages/'+this.UI.currentTeam).push({
      timestamp:now,
      text:"I am sending "+this.transactionAmount+" COINS to "+this.DB.getTeamName(this.selectedTeamID)+", reference: "+this.transactionReference,
      image:"",
      user:this.UI.currentUser,
      reference: this.transactionReference,
      amount: this.transactionAmount,
      receiver: this.selectedTeamID,
      action: "transaction"
    })
    .then(() => {
      this.db.object('teamActivities/'+this.UI.currentTeam).update({
        lastMessageTimestamp:now,
      });
      this.db.object('userTeams/'+this.UI.currentUser+'/'+this.UI.currentTeam).update({
        lastChatVisitTimestamp:now,
        lastChatVisitTimestampNegative:-1*now,
      });
      this.router.navigate(['chat',this.UI.currentTeam]);
    });
  }

  checkTransactionInput():void {
    this.transactionInputValid = (this.transactionReference!=null&&this.transactionReference!=""&&
                                  this.transactionAmount!=null&&this.transactionAmount>0&&
                                  this.transactionAmount<=Number(this.DB.getTeamBalance(this.UI.currentTeam))&&
                                  this.selectedTeamID!=null&&this.selectedTeamID!=""&&
                                  this.selectedTeamID!=this.UI.currentTeam);
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

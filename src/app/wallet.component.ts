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
    <div style="clear:both;text-align:center">
    <img src="./../assets/App icons/icon_share_03.svg" style="width:60px">
    </div>
    <div>
    <div style="float: left; width: 50%; text-align: right; padding: 5px">
    <div style="font-size: 25px;line-height:normal; color: black;">{{DB.getTeamBalance(UI.currentTeam)|number:'1.2-2'}}</div>
    </div>
    <div style="float: right; width: 50%; text-align: left; padding: 5px">
    <div style="color: black;">COINS</div>
    </div>
    </div>
    <button type="button" (click)="router.navigate(['buyCoins'])" style="float:left;width:100px;background-color:#43c14b">Buy COINS</button>
  </div>
  <div class='sheet' style="margin-top:10px">
  <div style="padding:5px 0 5px 0">
    <div style="width:170px;float:left;text-align:right;font-size:11px;line-height:12px;font-weight:bold">Date</div>
    <div style="width:100px;float:left;text-align:right;font-size:11px;line-height:13px;font-weight:bold">Amount</div>
    <div style="width:170px;float:left;text-align:right;font-size:11px;line-height:12px;font-weight:bold">Reference</div>
    <div style="width:125px;float:left;text-align:right;font-size:11px;line-height:12px;font-weight:bold">To/From</div>
    <div style="width:75px;float:left;text-align:right;font-size:11px;line-height:12px;font-weight:bold">Process time</div>
    <div style="width:100px;float:left;text-align:right;font-size:11px;line-height:13px;font-weight:bold">Balance</div>
  </div>
  <ul class="listLight">
    <li *ngFor="let transaction of PERRINNTeamTransactions | async" style="padding:5px 0 5px 0">
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.amount>0?"-> ":""}}{{transaction.timestamp | date :'medium'}}</div>
      <div style="width:100px;float:left;text-align:right;font-size:13px;line-height:13px">{{transaction.amount | number:'1.2-2'}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.reference}}</div>
      <div style="width:125px;float:left;text-align:right;font-size:10px;line-height:12px" (click)="router.navigate(['wallet',transaction.otherTeam])">{{DB.getTeamName(transaction.otherTeam)}}</div>
      <div style="width:75px;float:left;text-align:right;font-size:9px;line-height:12px">{{(transaction.timestamp-transaction.requestTimestamp)/1000 | number:'1.1-1'}} s</div>
      <div style="width:100px;float:left;text-align:right;font-size:13px;line-height:13px">{{transaction.balance | number:'1.2-2'}}</div>
    </li>
    </ul>
    <div style="color:blue; padding:10px 0 10px 0; cursor:pointer; text-align:center" (click)="transactionNumberDisplay=transactionNumberDisplay+30;this.PERRINNTeamTransactions = db.list('PERRINNTeamTransactions/'+this.UI.currentTeam,{query:{orderByChild:'timestampNegative',limitToFirst:this.transactionNumberDisplay}});">More transactions</div>
    </div>
  `,
})
export class WalletComponent {

PERRINNTeamTransactions: FirebaseListObservable<any>;
transactionNumberDisplay: number;

constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
  this.transactionNumberDisplay = 30;
  this.route.params.subscribe(params => {
    this.UI.currentTeam=params['id'];
    db.object('PERRINNTeams/'+this.UI.currentTeam).subscribe(snapshot=>{
      this.UI.currentTeamObj=snapshot;
    });
    this.PERRINNTeamTransactions = db.list('PERRINNTeamTransactions/'+this.UI.currentTeam,{query:{orderByChild:'timestampNegative',limitToFirst:this.transactionNumberDisplay}});
  });
}

}

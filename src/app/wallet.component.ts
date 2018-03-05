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
    <div style="width:100px;font-size:12px;cursor:pointer;color:blue;padding:10px;float:left" (click)="router.navigate(['createTransaction'])">Back</div>
    <img (error)="errorHandler($event)" [src]="DB.getTeamPhotoURL(UI.currentTeam)" (click)="router.navigate(['team',UI.currentTeam])" style="display: inline; float: right; margin: 7px 10px 7px 10px;object-fit:cover;height:40px;width:60px;cursor:pointer">
    <div style="clear:both;text-align:center">
    <img (error)="errorHandler($event)" src="./../assets/App icons/icon_share_03.svg" style="width:60px">
    </div>
    <div>
    <div style="text-align:center;font-size:18px;font-family:sans-serif;">{{DB.getTeamName(UI.currentTeam)}}</div>
    <div style="float: left; width: 50%; text-align: right; padding: 5px">
    <div style="font-size: 25px;line-height:normal; color: black;">{{DB.getTeamBalance(UI.currentTeam) | number:'1.2-2'}}</div>
    </div>
    <div style="float: right; width: 50%; text-align: left; padding: 5px">
    <div style="color: black;">COINS</div>
    </div>
    </div>
    <button type="button" (click)="router.navigate(['buyCoins'])" style="float:left;width:100px;background-color:#43c14b">Buy COINS</button>
    <div style="text-align:right; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="router.navigate(['COINinfo'])">COIN info</div>
  </div>
  <div class='sheet' style="margin-top:10px">
  <ul class="listLight">
    <li *ngFor="let transaction of PERRINNTeamTransactions | async">
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.timestamp | date :'medium'}}</div>
      <div style="width:100px;float:left;text-align:right;font-size:13px;line-height:13px">{{transaction.amount | number:'1.2-2'}}</div>
      <div style="width:170px;float:left;text-align:right;font-size:10px;line-height:12px">{{transaction.reference}}</div>
      <div style="width:125px;float:left;text-align:right;font-size:10px;line-height:12px">{{DB.getTeamName(transaction.otherTeam)}}</div>
      <div style="width:75px;float:left;text-align:right;font-size:9px;line-height:12px">{{(transaction.timestamp-transaction.requestTimestamp)/1000}} s</div>
      <div style="width:100px;float:left;text-align:right;font-size:13px;line-height:13px">{{transaction.balancePost | number:'1.2-2'}}</div>
    </li>
    </ul>
    </div>
  `,
})
export class WalletComponent {

PERRINNTeamTransactions: FirebaseListObservable<any>;

constructor(public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, public DB: databaseService, private route: ActivatedRoute) {
  this.route.params.subscribe(params => {
    this.UI.currentTeam=params['id'];
    this.PERRINNTeamTransactions = db.list('PERRINNTeamTransactions/'+this.UI.currentTeam);
  });
}

errorHandler(event) {
  event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
}

}

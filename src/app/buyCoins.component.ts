import { Component, NgZone } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'buyCoins',
  template: `
  <div id='main_container'>
  <div [hidden]='!enteringAmount'>
    <div class="sheet">
      <div class='title' style='float:left'>How many COINS would you like to buy?</div>
      <input maxlength="50" type="number" onkeypress="return event.charCode>=48" (keyup)="refreshAmountCharge()" style='width:100px;' [(ngModel)]="amountCOINSPurchased">
      <div class="title">What currency would you like to pay in?</div>
      <ul class="listLight" style='margin-top:20px'>
        <li *ngFor="let currency of currencyList | async"
          [class.selected]="currency.key === currentCurrencyID"
          (click)="currentCurrencyID = currency.key;refreshAmountCharge();">
          <div style="width:200px;height:20px;float:left;">{{currency.values.designation}}</div>
          <div style="width:200px;height:20px;float:left;">1 COIN costs {{1/currency.values.toCOIN|number:'1.2-2'}} {{currency.values.code}}</div>
        </li>
      </ul>
      <div class="content" style="text-align:center; padding-top:20px">{{amountCharge/100 | number:'1.2-2'}} {{currentCurrencyID | uppercase}} to be paid.</div>
      <div style="text-align:center">
        <button [hidden]='!UI.currentTeamObj?.leaders[UI.currentUser]' type="button" (click)="enteringAmount=false;enteringCardDetails=true">Proceed to payment</button>
        <div class='content' [hidden]='UI.currentTeamObj?.leaders[UI.currentUser]' style='font-weight:bold'>You need to be leader to buy COINS for this team.</div>
      </div>
    </div>
  </div>
  <div [hidden]='!enteringCardDetails'>
  <div class="module form-module">
  <div class="top">
  <div style="text-align:left; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="enteringAmount=true;enteringCardDetails=false">back</div>
  <img src="./../assets/App icons/icon_share_03.svg" style="width:50px">
  <div style="color:black">{{UI.currentTeamObj?.name}}</div>
  <div style="color:black;padding-bottom:15px">{{amountCOINSPurchased | number:'1.2-2'}} COINS</div>
  </div>
  <div class="form">
  <form>
  <div style="text-align:left;padding:0 0 20px 10px;float:left">Safe transfer</div>
  <img src="./../assets/App icons/Payment Method Icons/Light Color/22.png" style="width:40px;float:right;margin-right:10px">
  <img src="./../assets/App icons/Payment Method Icons/Light Color/2.png" style="width:40px;float:right">
  <img src="./../assets/App icons/Payment Method Icons/Light Color/1.png" style="width:40px;float:right">
  <input [(ngModel)]="cardNumber" name="card-number" type="text" placeholder="Card number *" (keyup)='messagePayment=""'>
  <div>
  <input [(ngModel)]="expiryMonth" style="width:30%;float:left" name="expiry-month" type="text" placeholder="MM *" (keyup)='messagePayment=""'>
  <div style="font-size:30px;float:left">/</div>
  <input [(ngModel)]="expiryYear" style="width:30%;float:left" name="expiry-year" type="text" placeholder="YY *" (keyup)='messagePayment=""'>
  </div>
  <input [(ngModel)]="cvc" name="cvc" type="text"  placeholder="CVC *" (keyup)='messagePayment=""'>
  <button type="button" (click)="processPayment()">Pay {{amountCharge/100 | number:'1.2-2'}} {{currentCurrencyID | uppercase}}</button>
  <div>{{messagePayment}}</div>
  </form>
  </div>
  </div>
  </div>
  <div [hidden]='!processingPayment'>
    <div class='sheet'>
      <div class='content' style="text-align:center">{{messagePayment}}</div>
      <div class='content' style="padding-top:30px; text-align:center">{{messagePERRINNTransaction}}</div>
    </div>
  </div>
  </div>
  `,
})
export class BuyCoinsComponent {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  amountCOINSPurchased: number;
  amountCharge: number;
  currentCurrencyID: string;
  messagePayment: string;
  messagePERRINNTransaction: string;
  currencyList: Observable<any[]>;
  newPaymentID: string;
  enteringAmount: boolean;
  enteringCardDetails: boolean;
  processingPayment: boolean;

  constructor(public db:AngularFireDatabase,public router:Router,private _zone:NgZone,public UI:userInterfaceService) {
    this.enteringAmount = true;
    this.enteringCardDetails = false;
    this.processingPayment = false;
    this.newPaymentID = "";
    this.messagePayment = "";
    this.messagePERRINNTransaction = "";
    this.amountCOINSPurchased=100;
    this.currentCurrencyID='gbp';
    this.currencyList = db.list('appSettings/currencyList').snapshotChanges().pipe(map(changes=>{
      return changes.map(c=>({key:c.payload.key,values:c.payload.val()}));
    }));
    this.refreshAmountCharge();
  }

  processPayment() {
    (<any>window).Stripe.card.createToken({
      number: this.cardNumber,
      exp_month: this.expiryMonth,
      exp_year: this.expiryYear,
      cvc: this.cvc
    }, (status: number, response: any) => {
      this._zone.run(() => {
        if (response.error) {
          this.messagePayment = response.error.message;
        }
        else {
          this.enteringCardDetails = false;
          this.processingPayment = true;
          this.messagePayment = `Processing card...`;
          this.newPaymentID = firebase.database().ref(`/teamPayments/${this.UI.currentTeam}`).push().key;
          firebase.database().ref(`/teamPayments/${this.UI.currentTeam}/${this.newPaymentID}`)
          .update({
            source: response.id,
            amountCOINSPurchased: this.amountCOINSPurchased,
            amountCharge: this.amountCharge,
            currency: this.currentCurrencyID,
            team: this.UI.currentTeam,
          })
          .then(()=>{
            this.db.object(`/teamPayments/${this.UI.currentTeam}/${this.newPaymentID}/response/outcome`).snapshotChanges().subscribe(paymentSnapshot=>{
              if (paymentSnapshot.payload.val().seller_message!=null) this.messagePayment = paymentSnapshot.payload.val().seller_message;
              if (this.messagePayment == "Payment complete.") this.messagePERRINNTransaction = "We are now sending COINS to your team...";
            });
            this.db.object(`/teamPayments/${this.UI.currentTeam}/${this.newPaymentID}/error`).snapshotChanges().subscribe(paymentSnapshot=>{
              if (paymentSnapshot.payload.val().message!=null) this.messagePayment = paymentSnapshot.payload.val().message;
            });
            this.db.object(`/teamPayments/${this.UI.currentTeam}/${this.newPaymentID}/PERRINNTransaction`).snapshotChanges().subscribe(transactionSnapshot=>{
              if (transactionSnapshot.payload.val().message!=null) this.messagePERRINNTransaction = transactionSnapshot.payload.val().message;
            });
          });
        }
      });
    });
  }

  refreshAmountCharge () {
    firebase.database().ref('appSettings/currencyList/'+this.currentCurrencyID).once('value').then(currency=>{
      this.amountCharge = Number((this.amountCOINSPurchased / currency.val().toCOIN * 100).toFixed(0));
    });
  }

}

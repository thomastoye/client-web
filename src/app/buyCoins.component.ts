import { Component, NgZone } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'buyCoins',
  template: `
  <div [hidden]='!thinkingAboutIt'>
    <div class="sheet">
      <div style="width:33%;max-width:200px;float:left;text-align:center;padding-top:25px">
      <img src="./../assets/App icons/icon_share_03.svg" style="width:100%;max-width:100px">
      </div>
      <div style="width:66%">
      <div class="title">{{(sheetContent1|async)?.title}}</div>
      <div class="content">{{(sheetContent1|async)?.content1}}</div>
      <div class="content">{{(sheetContent1|async)?.content2}}</div>
      <div class="content">{{(sheetContent1|async)?.content3}}</div>
      </div>
      <div style="height:50px"></div>
      <div style="width:33%;max-width:200px;float:left">
      <img src="{{(sheetContent2|async)?.image}}" style="width:100%;">
      </div>
      <div style="width:66%">
      <div class="title">{{(sheetContent2|async)?.title}}</div>
      <div class="content">{{(sheetContent2|async)?.content1}}</div>
      <div class="content">{{(sheetContent2|async)?.content2}}</div>
      <div class="content">{{(sheetContent2|async)?.content3}}</div>
      </div>
      <div style="height:50px"></div>
      <div style="width:33%;max-width:200px;float:left">
      <img src="{{(sheetContent3|async)?.image}}" style="width:100%;">
      </div>
      <div style="width:66%">
      <div class="title">{{(sheetContent3|async)?.title}}</div>
      <div class="content">{{(sheetContent3|async)?.content1}}</div>
      <div class="content">{{(sheetContent3|async)?.content2}}</div>
      <div class="content">{{(sheetContent3|async)?.content3}}</div>
      </div>
      <div style="height:50px"></div>
      <div style="text-align:center"><button type="button" (click)="refreshAmountCharge();thinkingAboutIt=false;enteringAmount=true">Buy COINS now</button></div>
    </div>
    <div style="height:10px"></div>
  </div>
  <div [hidden]='!enteringAmount'>
    <div class="sheet">
      <div class='title' style='float:left'>How many COINS would you like to buy?</div>
      <input (keyup)="refreshAmountCharge()" style='width:100px' [(ngModel)]="amountCOINSPurchased" type='text'>
      <ul class='listDark' style='margin-top:20px'>
        <div class="listSeperator">What currency would you like to pay in?</div>
        <li *ngFor="let currency of currencyList | async"
          [class.selected]="currency.$key === currentCurrencyID"
          (click)="currentCurrencyID = currency.$key;refreshAmountCharge();">
          <div style="width:200px;height:20px;float:left;">{{currency.designation}}</div>
          <div style="width:200px;height:20px;float:left;">1 COIN costs {{1/currency.toCOIN|number:'1.2-2'}} {{currency.code}}</div>
        </li>
      </ul>
      <div class="content" style="text-align:center; padding-top:20px">{{amountCharge/100 | number:'1.2-2'}} {{currentCurrencyID | uppercase}} to be paid.</div>
      <div style="text-align:center"><button type="button" (click)="enteringAmount=false;enteringCardDetails=true">Proceed to payment</button></div>
    </div>
  </div>
  <div [hidden]='!enteringCardDetails'>
  <div class="module form-module">
  <div class="top">
  <div style="text-align:left; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="enteringAmount=true;enteringCardDetails=false">back</div>
  <img src="./../assets/App icons/icon_share_03.svg" style="width:50px">
  <div style="color:black">{{getTeamName(currentTeamID)}}</div>
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
  `,
})
export class BuyCoins {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  amountCOINSPurchased: number;
  amountCharge: number;
  currentCurrencyID: string;
  messagePayment: string;
  messagePERRINNTransaction: string;
  currentUser: FirebaseObjectObservable<any>;
  currencyList: FirebaseListObservable<any>;
  currentUserID: string;
  currentTeamID: string;
  newPaymentID: string;
  thinkingAboutIt: boolean;
  enteringAmount: boolean;
  enteringCardDetails: boolean;
  processingPayment: boolean;
  sheetContent1: FirebaseObjectObservable<any>;
  sheetContent2: FirebaseObjectObservable<any>;
  sheetContent3: FirebaseObjectObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, private _zone: NgZone) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.thinkingAboutIt = true;
        this.enteringAmount = false;
        this.enteringCardDetails = false;
        this.processingPayment = false;
        this.newPaymentID = "";
        this.messagePayment = "";
        this.messagePERRINNTransaction = "";
        this.amountCOINSPurchased=100;
        this.currentCurrencyID='gbp';
        this.sheetContent1 = db.object('appSettings/whatIsCOIN');
        this.sheetContent2 = db.object('appSettings/howToUseCOIN');
        this.sheetContent3 = db.object('appSettings/whyBuyCOIN');
        this.currentUserID = auth.uid;
        this.currencyList = db.list('appSettings/currencyList');
        db.object('userInterface/'+auth.uid).subscribe(userInterface => {
          this.currentTeamID = userInterface.currentTeam;
        });
      }
    });
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
          this.newPaymentID = firebase.database().ref(`/userPayments/${this.currentUserID}`).push().key;
          firebase.database().ref(`/userPayments/${this.currentUserID}/${this.newPaymentID}`)
          .update({
            source: response.id,
            amountCOINSPurchased: this.amountCOINSPurchased,
            amountCharge: this.amountCharge,
            currency: this.currentCurrencyID,
            team: this.currentTeamID,
          })
          .then(()=>{
            this.db.object(`/userPayments/${this.currentUserID}/${this.newPaymentID}/response/outcome`).subscribe(paymentSnapshot=>{
              if (paymentSnapshot.seller_message!=null) this.messagePayment = paymentSnapshot.seller_message;
              if (this.messagePayment == "Payment complete.") this.messagePERRINNTransaction = "We are now sending COINS to your team...";
            });
            this.db.object(`/userPayments/${this.currentUserID}/${this.newPaymentID}/error`).subscribe(paymentSnapshot=>{
              if (paymentSnapshot.message!=null) this.messagePayment = paymentSnapshot.message;
            });
            this.db.object(`/userPayments/${this.currentUserID}/${this.newPaymentID}/PERRINNTransaction`).subscribe(transactionSnapshot=>{
              if (transactionSnapshot.message!=null) this.messagePERRINNTransaction = transactionSnapshot.message;
            });
          });
        }
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

  refreshAmountCharge () {
    firebase.database().ref('appSettings/currencyList/'+this.currentCurrencyID).once('value').then(currency=>{
      this.amountCharge = Number((this.amountCOINSPurchased / currency.val().toCOIN * 100).toFixed(0));
    });
  }

}

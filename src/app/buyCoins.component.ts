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
      <div class="title">{{(sheetContent1|async)?.title}}</div>
      <img src="./../assets/App icons/icon_share_03.svg" style="width:75px; float:left">
      <div class="content">{{(sheetContent1|async)?.content1}}</div>
      <div class="content">{{(sheetContent1|async)?.content2}}</div>
      <div class="content">{{(sheetContent1|async)?.content3}}</div>
    </div>
    <div style="height:10px"></div>
    <div class="sheet">
      <div class="title">{{(sheetContent2|async)?.title}}</div>
      <img src="{{(sheetContent2|async)?.image}}" style="width:75px; float:left">
      <div class="content">{{(sheetContent2|async)?.content1}}</div>
      <div class="content">{{(sheetContent2|async)?.content2}}</div>
      <div class="content">{{(sheetContent2|async)?.content3}}</div>
    </div>
    <div style="height:10px"></div>
    <div class="sheet">
      <div class="title">{{(sheetContent3|async)?.title}}</div>
      <img src="{{(sheetContent3|async)?.image}}" style="width:75px; float:left">
      <div class="content">{{(sheetContent3|async)?.content1}}</div>
      <div class="content">{{(sheetContent3|async)?.content2}}</div>
      <div class="content">{{(sheetContent3|async)?.content3}}</div>
      <div style="text-align:center"><button type="button" (click)="thinkingAboutIt=false">Buy COINS now</button></div>
    </div>
    <div style="height:10px"></div>
  </div>
  <div [hidden]='thinkingAboutIt'>
  <div class="module form-module">
  <div class="top">
  <img src="./../assets/App icons/icon_share_03.svg" style="width:50px">
  <div style="color:black">{{getTeamName(currentTeamID)}}</div>
  <div [hidden]='changeAmount' style="color:black;padding-bottom:15px">{{amountCOINSPurchased | number:'1.2-2'}} COINS</div>
  <input [hidden]='!changeAmount' [(ngModel)]="amountCOINSPurchased" type='text'>
  <div style="text-align:right; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="changeAmount=!changeAmount">{{changeAmount?"Save amount":"Change amount"}}</div>
  </div>
  <div class="form">
  <form>
  <div [hidden]='processingPayment'>
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
  <button type="button" (click)="processPayment()">Pay {{amountCOINSPurchased*COINPrice/100 | number:'1.2-2'}} {{currency | uppercase}}</button>
  </div>
  <div>{{messagePayment}}</div>
  <div style="padding-top:30px">{{messagePERRINNTransaction}}</div>
  </form>
  </div>
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
  COINPrice: number;
  amountCharge: number;
  currency: string;
  messagePayment: string;
  messagePERRINNTransaction: string;
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  currentTeamID: string;
  newPaymentID: string;
  thinkingAboutIt: boolean;
  changeAmount: boolean;
  processingPayment: boolean;
  sheetContent1: FirebaseObjectObservable<any>;
  sheetContent2: FirebaseObjectObservable<any>;
  sheetContent3: FirebaseObjectObservable<any>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, private _zone: NgZone) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.processingPayment = false;
        this.thinkingAboutIt = true;
        this.changeAmount = false;
        this.newPaymentID = "";
        this.messagePayment = "";
        this.messagePERRINNTransaction = "";
        this.amountCOINSPurchased=100;
        this.amountCharge=this.amountCOINSPurchased/2*100;
        this.COINPrice = 50;
        this.currency='gbp';
        this.sheetContent1 = db.object('appSettings/whatIsCOIN');
        this.sheetContent2 = db.object('appSettings/howToUseCOIN');
        this.sheetContent3 = db.object('appSettings/whyBuyCOIN');
        this.currentUserID = auth.uid;
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
          this.processingPayment = false;
        }
        else {
          this.processingPayment = true;
          this.messagePayment = `Processing card...`;
          this.amountCharge = this.amountCOINSPurchased * this.COINPrice;
          this.newPaymentID = firebase.database().ref(`/userPayments/${this.currentUserID}`).push().key;
          firebase.database().ref(`/userPayments/${this.currentUserID}/${this.newPaymentID}`)
          .update({
            source: response.id,
            amountCOINSPurchased: this.amountCOINSPurchased,
            amountCharge: this.amountCharge,
            currency: this.currency,
            team: this.currentTeamID,
          })
          .then(()=>{
            this.db.object(`/userPayments/${this.currentUserID}/${this.newPaymentID}/response/outcome`).subscribe(paymentSnapshot=>{
              if (paymentSnapshot.seller_message!=null) this.messagePayment = paymentSnapshot.seller_message;
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

}

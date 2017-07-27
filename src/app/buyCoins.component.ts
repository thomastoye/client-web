import { Component, NgZone } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'buyCoins',
  template: `
  <div class="titleSeperator" style="background-image: linear-gradient(145deg, rgb(13, 71, 161), rgb(66, 165, 245));">
  <div class="module form-module">
  <div class="top">
  <img src="./../assets/App icons/icon_share_03.svg" style="width:50px">
  <div style="color:black;padding-bottom:15px">{{amountCOINSPurchased | number:'1.2-2'}} COINS</div>
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
  <button type="button" (click)="processPayment()">Pay {{amountCharge/100 | number:'1.2-2'}} {{currency | uppercase}}</button>
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
  amountCharge: number;
  currency: string;
  messagePayment: string;
  messagePERRINNTransaction: string;
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  currentTeamID: string;
  newPaymentID: string;
  processingPayment: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, private _zone: NgZone) {
    this.processingPayment = false;
    this.newPaymentID = "";
    this.messagePayment = "";
    this.messagePERRINNTransaction = "";
    this.amountCOINSPurchased=100;
    this.amountCharge=this.amountCOINSPurchased/2*100;
    this.currency='gbp';
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
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
              this.messagePayment = paymentSnapshot.seller_message;
            });
            this.db.object(`/userPayments/${this.currentUserID}/${this.newPaymentID}/error`).subscribe(paymentSnapshot=>{
              this.messagePayment = paymentSnapshot.message;
            });
            this.db.object(`/userPayments/${this.currentUserID}/${this.newPaymentID}/PERRINNTransaction`).subscribe(transactionSnapshot=>{
              this.messagePERRINNTransaction = transactionSnapshot.message;
            });
          });
        }
      });
    });
  }

}

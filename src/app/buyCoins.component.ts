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
  <div style="color:black;padding-bottom:15px">{{amountCOINS | number:'1.2-2'}} COINS</div>
  </div>
  <div class="form">
  <form>
  <span class="payment-message">{{message}}</span>
  <input [(ngModel)]="cardNumber" name="card-number" type="text" placeholder="Card number *">
  <div>
  <input [(ngModel)]="expiryMonth" style="width:30%;float:left" name="expiry-month" type="text" placeholder="MM *">
  <div style="font-size:30px;float:left">/</div>
  <input [(ngModel)]="expiryYear" style="width:30%;float:left" name="expiry-year" type="text" placeholder="YY *">
  </div>
  <input [(ngModel)]="cvc" name="cvc" type="text"  placeholder="CVC *">
  <button type="button" (click)="getToken()">Pay</button>
  <img src="./../assets/App icons/powered_by_stripe.svg" style="width:100px; padding-top:30px;">
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
  amountCOINS: number;
  message: string;
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  photoURL: string;
  newTeam: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, private _zone: NgZone) {
    this.amountCOINS=75;
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){}
      else {
        this.currentUserID = auth.uid;
      }
    });
  }

  getToken() {
    this.message = 'Loading...';
    (<any>window).Stripe.card.createToken({
      number: this.cardNumber,
      exp_month: this.expiryMonth,
      exp_year: this.expiryYear,
      cvc: this.cvc
    }, (status: number, response: any) => {
      // Wrapping inside the Angular zone
      this._zone.run(() => {
        if (status === 200) {
          this.message = `Success! Card token ${response.card.id}.`;
        } else {
          this.message = response.error.message;
        }
      });
    });
  }

}

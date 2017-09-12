import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'createTransaction',
  template: `
  <div class="sheet">
  <div class="title" style="color: black;text-align:left;">Available balance {{currentBalance | number:'1.2-2'}} COINS</div>
  <div class="user">
  <input maxlength="50" type="number" onkeypress="return event.charCode>=48" (keyup)="checkTransactionInput()" [(ngModel)]="this.transactionAmount" placeholder="Amount *" />
  <input maxlength="50" (keyup)="checkTransactionInput()" [(ngModel)]="this.transactionReference" placeholder="Reference *" />
  <div class="title">Select receiving team</div>
  <ul class="listLight">
    <li *ngFor="let team of userTeams | async"
    [class.selected]="team.$key === selectedTeamID"
    (click)="selectedTeamID = team.$key;checkTransactionInput()">
      <img (error)="errorHandler($event)"[src]="getTeamPhotoURL(team.$key)" style="display: inline; float: left; margin: 0 10px 0 10px; opacity: 1; object-fit: cover; height:30px; width:30px">
      {{getTeamName(team.$key)}}{{ (getUserLeader(team.$key)? " *" : "")}}
    </li>
  </ul>
  <button [hidden]='!transactionInputValid' (click)="createTransaction()">Confirm transaction{{isUserLeader?"":" (Team leader will have to approve) "}}{{messageCreateTransaction}}</button>
  </div>
  </div>
  `,
})
export class CreateTransactionComponent {
  currentUser: FirebaseObjectObservable<any>;
  currentUserID: string;
  photoURL: string;
  currentTeam: FirebaseObjectObservable<any>;
  currentTeamID: string;
  userTeams: FirebaseListObservable<any>;
  transactionReference: string;
  transactionAmount: number;
  selectedTeamID: string;
  messageCreateTransaction: string;
  currentBalance: number;
  transactionInputValid: boolean;
  isUserLeader: boolean;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.transactionInputValid = false;
    this.isUserLeader = false;
    this.currentBalance = 0;
    this.afAuth.authState.subscribe((auth) => {
      if (auth==null){
        this.userTeams=null;
      }
      else {
        db.object('userInterface/'+auth.uid).subscribe( userInterface => {
          this.currentUserID = auth.uid;
          this.currentTeamID = userInterface.currentTeam;
          this.getTeamWalletBalance(this.currentTeamID).then(balance=>{
            this.currentBalance = Number(balance);
          });
          this.db.object('teamUsers/'+this.currentTeamID+'/'+this.currentUserID).subscribe(user => {
            this.isUserLeader = user.leader;
          });
          this.userTeams = db.list('userTeams/'+auth.uid, {
            query:{
              orderByChild:'following',
              equalTo: true,
            }
          });
        });
      }
    });
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

  getTeamName (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  getTeamPhotoURL (ID: string) :string {
    var output;
    this.db.object('teams/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  getUserLeader (ID: string) :boolean {
    var output;
    this.db.object('teamUsers/'+ID+'/'+this.currentUserID).subscribe(snapshot => {
      output = snapshot.leader;
    });
    return output;
  }

  createTransaction() {
    if (this.isUserLeader) {
      this.db.list('teamTransactions/'+this.currentTeamID).push({
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
      this.db.list('teamTransactionRequests/'+this.currentTeamID).push({
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
                                  this.selectedTeamID!=this.currentTeamID);
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

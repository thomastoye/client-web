import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'wallet',
  template: `
  <div class="titleSeperator">
    <div>
    <img src="./../assets/App icons/icon_share_03.svg" style="width:80px">
    </div>
    <div>
    <div style="float: left; width: 50%; text-align: right; padding: 5px">
    <div style="font-size: 30px; color: black;">0.00</div>
    </div>
    <div style="float: right; width: 50%; text-align: left; padding: 5px">
    <div style="color: black;">COINS</div>
    </div>
    </div>
  </div>
  <ul class="teams">
    <h6 style="padding:7px; color:#AAA;">TRANSACTIONS</h6>
    <li *ngFor="let transaction of teamTransactions | async">
      Transaction        {{transaction.createdTimestamp | date :'medium'}}       {{transaction.amount}}       {{transaction.reference}}       {{transaction.status}}
    </li>
  </ul>
  <button (click)="this.router.navigate(['createTransaction'])">New transaction</button>
  `,
})
export class WalletComponent {

teamTransactions: FirebaseListObservable<any>;
currentTeam: FirebaseObjectObservable<any>;
currentTeamID: string;
userTeams: FirebaseListObservable<any>;
teams: FirebaseListObservable<any>;
teamUsers: FirebaseListObservable<any>;

constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
  this.afAuth.authState.subscribe((auth) => {
      if (auth == null) {
        this.currentTeamID = "";
      }
      else {
        db.object('users/' + auth.uid).subscribe( snapshot => {
          this.currentTeamID = snapshot.currentTeam;
          this.teamTransactions = db.list('teamTransactions/'+this.currentTeamID);
        });
      }
  });
}

}

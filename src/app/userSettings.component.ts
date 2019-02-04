import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'userSettings',
  template: `
  <div id='main_container'>
  <div class="sheet" style="background-color:#f5f5f5">
  <div class="buttonDiv" style="color:red" (click)="this.logout();router.navigate(['login']);">logout</div>
  <div class="title">Teams</div>
  <ul class="listLight">
    <li style="cursor:default" *ngFor="let team of viewUserTeams|async"
      [class.selected]="team.key === UI.currentTeam">
      <div style="width:200px;float:left">
      <img [src]="team.values.imageUrlThumb" style="display: inline; float: left; margin: 7px 10px 7px 10px;object-fit:cover;height:20px;width:30px;border-radius:3px">
      <div style="width:150px;float:left;margin-top:10px;color:#222;font-size:11px">{{team.values.name}}{{(team?.isFocusUserLeader|async)?" *":""}}</div>
      </div>
      <div style="width:100px;height:30px;float:left">
      <div *ngIf="!(team?.isFocusUserLeader|async)" class="buttonDiv" style="font-size:11px;color:red" (click)="stopFollowing(team.key)">Stop following</div>
      </div>
      <div class="seperator"></div>
    </li>
  </ul>
  </div>
  </div>
  `,
})
export class UserSettingsComponent {
  viewUserTeams: Observable<any[]>;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router, public UI: userInterfaceService, private route: ActivatedRoute) {
    this.route.params.subscribe(params => {
      this.UI.focusUser = params.id;
      this.UI.currentTeam = '';
      this.viewUserTeams = db.list('viewUserTeams/' + this.UI.focusUser, ref => ref.orderByChild('lastMessageTimestampNegative')).snapshotChanges().pipe(map(changes => {
        return changes.map(c => ({
          key: c.payload.key,
          values: c.payload.val(),
          isFocusUserLeader: this.db.object('PERRINNTeams/' + c.payload.key + '/leaders/' + this.UI.focusUser).valueChanges(),
        }));
      }));
    });
  }

  stopFollowing(team) {
    this.db.object('viewUserTeams/' + this.UI.currentUser + '/' + team).remove();
    this.db.object('subscribeTeamUsers/' + team + '/' + this.UI.currentUser).remove();
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

}

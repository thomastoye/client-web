import { Component } from '@angular/core';
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
  </div>
  `,
})
export class UserSettingsComponent {

  constructor(public afAuth: AngularFireAuth, public router: Router, public UI: userInterfaceService) {
  }

  logout() {
    this.afAuth.auth.signOut();
    this.UI.currentUser = null;
  }

}

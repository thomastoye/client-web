import { Injectable }    from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { Router } from '@angular/router'

@Injectable()
export class userInterfaceService {
  focusUser:string;
  focusProject:string;
  currentTeam:string;
  searchFilter: string;
  currentUser: string;

  constructor(private afAuth: AngularFireAuth, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth!=null) {
        this.currentUser = auth.uid;
        this.focusUser = auth.uid;
        this.router.navigate(['userProfile']);
      }
      else {
        this.currentUser = null;
        this.focusUser = null;
      }
    });
  }
}

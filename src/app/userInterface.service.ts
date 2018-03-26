import { Injectable }    from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';

@Injectable()
export class userInterfaceService {
  focusUser:string;
  focusProject:string;
  currentTeam:string;
  currentUser: string;

  constructor(private afAuth: AngularFireAuth, public db: AngularFireDatabase) {
    this.afAuth.authState.subscribe((auth) => {
      if (auth!=null) {
        this.currentUser=auth.uid;
        if (this.focusUser==null) this.focusUser=auth.uid;
        this.db.object('PERRINNUsers/'+this.focusUser).subscribe(snapshot=>{
          if (this.currentTeam==null) this.currentTeam=snapshot.personalTeam;
        });
      }
      else {
        this.currentUser=null;
        this.focusUser=null;
        this.currentTeam=null;
      }
    });
  }
}

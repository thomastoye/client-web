import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router'

@Component({
  selector: 'messageCenter',
  template: `
  <div class="message">
  <div class="general">{{messageGeneral}}</div>
  <div class="important">{{messageImportant}}</div>
  <div class="urgent">{{messageUrgent}}</div>
  </div>
  `,
})
export class MessageCenterComponent {
  currentUser: FirebaseObjectObservable<any>;
  messageGeneral: string;
  messageImportant: string;
  messageUrgent: string;

  constructor(public afAuth: AngularFireAuth, public db: AngularFireDatabase, public router: Router) {
    this.afAuth.authState.subscribe((auth) => {
        if (auth == null) {
          this.messageGeneral = "Please login or register"
          this.messageImportant = ""
          this.messageUrgent = ""
        }
        else {
          if (!auth.emailVerified) {
            this.messageGeneral = ""
            this.messageImportant = ""
            this.messageUrgent = "Please verify your email (after verification you need to logout and login again)"
          }
          else {
            db.object('users/'+auth.uid).subscribe((user) => {
              if (!user.firstName || !user.lastName || !user.photoURL) {
                this.messageGeneral = ""
                this.messageImportant = "Please edit your profile (name and photo)"
                this.messageUrgent = ""
              }
              else {
                this.messageGeneral = ""
                this.messageImportant = ""
                this.messageUrgent = ""
              }
            });
          }
        }
    });
  }

}

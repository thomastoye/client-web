import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'login',
  template: `
  <div id='main_container'>
  <div id="login">
    <div class="module form-module">
      <div class="form">
        <form>
          <img src="./../assets/App icons/publiceye.jpg" style="width:95%;margin:10px 0 10px 0">
          <img src="./../assets/App icons/PERRINN logo.png" style="width:95%;margin:10px 0 10px 0">
          <div [hidden]="UI.currentUser!=null">
          <div style="text-align:right; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="newUser=!newUser;messageUser=''">{{newUser?"Already have an account?":"Need a new account?"}}</div>
          <input maxlength="500" [(ngModel)]="email" name="email" type="text" placeholder="Email *" (keyup)="messageUser=''" required/>
          <input maxlength="500" [(ngModel)]="password" name="password" type="password" placeholder="Password *" (keyup)="messageUser=''" required/>
          <button [hidden]="newUser" type="button" (click)="login(email,password)">Login</button>
          <div [hidden]="newUser" style="text-align:center; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="resetPassword(email)">Forgot password?</div>
          <div [hidden]="!newUser">
          <!--Old Register-->
          <app-register></app-register>
          </div>
          </div>
          <div [hidden]="UI.currentUser==null">
          <button type="button" (click)="logout()">Logout</button>
          </div>
          <div *ngIf="messageUser" style="text-align:center;padding:10px;color:red">{{messageUser}}</div>
        </form>
      </div>
      <div class="cta"><a href='mailto:perrinnlimited@gmail.com'>Contact PERRINN</a></div>
    </div>
  </div>
  </div>
  `,
})

export class LoginComponent  {

  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  familyName: string;
  message: string;
  messageUser: string;
  newUser: boolean;

  constructor(public afAuth: AngularFireAuth, public router: Router, public db: AngularFireDatabase, public UI: userInterfaceService) {
    this.newUser = false;
    this.UI.currentTeam = '';
    this.afAuth.user.subscribe((auth) => {
      if (auth != null) {
        this.router.navigate(['user', auth.uid]);
      }
    });
  }

  login(email: string, password: string) {
    this.afAuth.auth.signInWithEmailAndPassword(email, password).catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      if (errorCode === 'auth/wrong-password') {
        this.messageUser = 'Wrong password.';
      } else {
        this.messageUser = errorMessage;
      }
    });
  }

  resetPassword(email: string) {
    this.afAuth.auth.sendPasswordResetEmail(email)
    .then(_ => this.messageUser = 'An email has been sent to you')
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      this.messageUser = errorMessage;
    });
  }

  logout() {
    this.afAuth.auth.signOut()
    .then(_ => this.messageUser = 'Successfully logged out')
    .catch(err => this.messageUser = 'You were not logged in');
  }

  register(email: string, password: string, passwordConfirm: string, name: string, familyName: string) {
    if (email == null || password == null || passwordConfirm == null || name == null || familyName == null) {
        this.messageUser = 'You need to fill all the fields';
    } else {
      if (password != passwordConfirm) {
        this.messageUser = 'Verification password doesn\'t match';
      } else {
        this.afAuth.auth.createUserWithEmailAndPassword(email, password).catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          if (errorCode == 'auth/weak-password') {
            this.messageUser = 'The password is too weak.';
          } else {
            this.messageUser = errorMessage;
          }
        }).then(_ => {
          this.afAuth.user.subscribe((auth) => {
            this.db.list('users/' + auth.uid).push({
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              name,
              familyName,
            });
          });
        });
      }
    }
  }

}

import { Component } from '@angular/core';
import { AuthenticationService } from './auth.service';
import { Router } from '@angular/router'
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';




@Component({
  selector: 'login',
  providers: [AuthenticationService],
  template: `
  <div id="login">
    <div class="module form-module">
      <div class="form">
        <form>
          <input [(ngModel)]="this.email" name="email" type="text" placeholder="Email"/>
          <input [(ngModel)]="this.password" name="password" type="password" placeholder="Password"/>
          <button type="button" (click)="this.authService.login(this.email,this.password)">Login</button>
          <button type="button" (click)="this.authService.logout()">Logout</button>
          <button type="button" (click)="this.authService.register(this.email,this.password)">Register</button>
          <button type="button" (click)="this.authService.sendEmailVerification()">Send email verification link</button>
          <button type="button" (click)="editProfile()">Edit your profile</button>
        </form>
      </div>
      <div class="cta"><a href='mailto:contactperrinn@gmail.com'>Contact PERRINN</a></div>
      <div class="cta"><a href='https://docs.google.com/document/d/1IjmDbmcW2IDg5Kj9ENpY3_Fw-oHv3RCJ2f8ZJdbjRpk/pub'>Learn more about PERRINN</a></div>
    </div>
  </div>
  `,
})

export class LoginComponent  {

  currentUserID: string;
  email: string;
  password: string;
  message: string;

  constructor(
    public authService: AuthenticationService,
    private router: Router,
    public afAuth: AngularFireAuth,
    public db: AngularFireDatabase
  ) {
    this.afAuth.authState.subscribe((auth) => {
        if (auth == null) {
          this.currentUserID="";
        }
        else {
          this.currentUserID=auth.uid;
        }
    });
  }

  editProfile () {
    this.db.list('users/').update(this.currentUserID, {focusUserID:this.currentUserID});
    this.router.navigate(['user']);
  }

}

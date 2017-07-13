import { Component } from '@angular/core';
import { AuthenticationService } from './auth.service';
import { Router } from '@angular/router'
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';



@Component({
  selector: 'login',
  providers: [AuthenticationService],
  template: `
  <div id="login">
    <div class="module form-module">
    <div class="message">{{message}}</div>
      <div class="form">
        <form>
          <input [(ngModel)]="this.email" name="email" type="text" placeholder="Email"/>
          <input [(ngModel)]="this.password" name="password" type="password" placeholder="Password"/>
          <button type="button" (click)="this.authService.login(this.email,this.password)">Login</button>
          <button type="button" (click)="this.authService.logout()">Logout</button>
          <button type="button" (click)="this.authService.register(this.email,this.password)">Register</button>
          <button type="button" (click)="this.authService.sendEmailVerification()">Send email verification link</button>
        </form>
      </div>
      <div class="cta"><a href='mailto:contactperrinn@gmail.com'>Contact PERRINN</a></div>
      <div class="cta"><a href='https://docs.google.com/document/d/1IjmDbmcW2IDg5Kj9ENpY3_Fw-oHv3RCJ2f8ZJdbjRpk/pub'>Learn more about us</a></div>
    </div>
  </div>
  `,
})

export class LoginComponent  {

  email: string;
  password: string;
  message: string;

  constructor(
    public authService: AuthenticationService,
    private router: Router,
    public afAuth: AngularFireAuth
  ) {
    this.afAuth.authState.subscribe((auth) => {
      if (!auth) {this.message = "please login or register"}
      else {
        firebase.auth().currentUser.reload();
        firebase.auth().currentUser.getToken(true);
        if (!auth.emailVerified) {this.message = "please verify your email"}
        else {this.message = "you are logged in and ready to go!"}
      }
    });

  }

}

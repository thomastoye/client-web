import { Component } from '@angular/core';
import { Router } from '@angular/router'
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';




@Component({
  selector: 'login',
  template: `
  <div id="login">
    <div class="module form-module">
      <div class="form">
        <form>
          <div [hidden]="loggedIn">
          <button style="text-align:right; font-size:10px" type="button" (click)="newUser=!newUser">{{newUser?"Already have an account?":"Need a new account?"}}</button>
          <input maxlength="500" [(ngModel)]="email" name="email" type="text" placeholder="Email"/>
          <input maxlength="500" [(ngModel)]="password" name="password" type="password" placeholder="Password"/>
          <button [hidden]="newUser" type="button" (click)="login(email,password)">Login {{messageLogin}}</button>
          <div [hidden]="!newUser">
          <input maxlength="500" [(ngModel)]="passwordConfirm" name="passwordConfirm" type="password" placeholder="Confirm password"/>
          <input maxlength="500" [(ngModel)]="firstName" style="text-transform: lowercase;"  name="firstName" type="text" placeholder="First name"/>
          <input maxlength="500" [(ngModel)]="lastName" style="text-transform: lowercase;" name="lastName" type="text" placeholder="Last name"/>
          <input maxlength="500" [(ngModel)]="photoURL" name="photoURL" placeholder="Paste profile image from the web here" style="font-size:9px"/>
          <img [src]="this.photoURL" style="object-fit:contain; height:100px; width:100%">
          <button type="button" (click)="register(email,password)">Register {{messageRegister}}</button>
          </div>
          </div>
          <div [hidden]="!loggedIn">
          <button type="button" (click)="logout()">Logout {{messageLogout}}</button>
          <div [hidden]="emailVerified">
          <div style="font-size:10px">To use this app you need to verify your email address. After clicking the link in the email, you need to logout and login to complete the setup.</div>
          <button type="button" (click)="sendEmailVerification()">Send email verification {{messageVerification}}</button>
          </div>
          </div>
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
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  message: string;
  messageRegister: string;
  messageVerification: string;
  messageLogout: string;
  messageLogin: string;
  loggedIn: boolean;
  emailVerified: boolean;
  newUser: boolean;

  constructor(
    private router: Router,
    public afAuth: AngularFireAuth,
    public db: AngularFireDatabase
  ) {
    var loginBackgroundImage;
    loginBackgroundImage = 'url("https://upload.wikimedia.org/wikipedia/commons/d/d7/Oslo%2C_Norway_1952_%2812350700414%29.jpg")';
    this.newUser = false;
    this.afAuth.authState.subscribe((auth) => {
        if (auth == null) {
          this.currentUserID="";
          this.loggedIn = false;
          this.emailVerified = true;
          document.getElementById('login').style.backgroundImage = loginBackgroundImage;
        }
        else {
          this.currentUserID=auth.uid;
          this.loggedIn = true;
          if (!auth.emailVerified) {
            this.emailVerified = false;
          }
          else {
            this.emailVerified = true;
          }
        }
    });
  }

  login(email: string, password: string) {
    this.clearAllMessages ();
    this.afAuth.auth.signInWithEmailAndPassword(email, password)
    .then(_ => this.messageLogin="Successfully logged in")
    .catch(err => this.messageLogin="Error: Verify your email and password or create a new account");
    }
  logout() {
    this.clearAllMessages ();
    this.afAuth.auth.signOut()
    .then(_ => this.messageLogout="Successfully logged out")
    .catch(err => this.messageLogout="Error: You were not logged in");
  }
  register(email: string, password: string) {
    this.firstName = this.firstName.toLowerCase();
    this.lastName = this.lastName.toLowerCase();
    this.clearAllMessages ();
    if (this.email==""||this.password==""||this.passwordConfirm==""||!(this.password==this.passwordConfirm)||this.firstName==""||this.lastName==""||this.photoURL=="") {
        this.messageRegister="Error: You need to fill all the fields";
    }
    else {
      this.afAuth.auth.createUserWithEmailAndPassword(email, password)
      .catch(err => this.messageRegister="Error: This email is already used or you haven't provided valid information")
      .then(_=> {
        this.afAuth.authState.subscribe((auth) => {
          this.db.object('users/' + auth.uid).update({firstName: this.firstName, lastName: this.lastName, photoURL: this.photoURL})
          .then(_ => this.messageRegister="Successful registered")
          .catch(err => this.messageRegister="Error: We couldn't save your profile");
        });
      });
    }
  }
  sendEmailVerification() {
    this.clearAllMessages ();
    firebase.auth().currentUser.sendEmailVerification()
    .then(_ => this.messageVerification="An email has been sent to you")
    .catch(err => this.messageVerification="Error: You need to login or register first");
  }

  clearAllMessages () {
    this.messageLogin = "";
    this.messageLogout = "";
    this.messageRegister = "";
    this.messageVerification = "";
  }

}

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
          <input maxlength="500" [(ngModel)]="this.email" name="email" type="text" placeholder="Email"/>
          <input maxlength="500" [(ngModel)]="this.password" name="password" type="password" placeholder="Password"/>
          <button type="button" (click)="login(this.email,this.password)">Login {{messageLogin}}</button>
          <button type="button" (click)="logout()">Logout {{messageLogout}}</button>
          <button type="button" (click)="register(this.email,this.password)">Register {{messageRegister}}</button>
          <button type="button" (click)="sendEmailVerification()">Send email verification {{messageVerification}}</button>
          <button type="button" (click)="editProfile()">Edit your profile {{messageEditProfile}}</button>
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
  messageRegister: string;
  messageVerification: string;
  messageLogout: string;
  messageLogin: string;
  messageEditProfile: string;

  constructor(
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

  login(email: string, password: string) {
    this.clearAllMessages ();
    this.afAuth.auth.signInWithEmailAndPassword(email, password)
    .then(_ => this.messageLogin="Successfully logged in")
    .catch(err => this.messageLogin="Error: Verify your email and password or register a new account");
    }
  logout() {
    this.clearAllMessages ();
    this.afAuth.auth.signOut()
    .then(_ => this.messageLogout="Successfully logged out")
    .catch(err => this.messageLogout="Error: You were not logged in");
  }
  register(email: string, password: string) {
    this.clearAllMessages ();
    this.afAuth.auth.createUserWithEmailAndPassword(email, password)
    .then(_ => this.messageRegister="Successful registered")
    .catch(err => this.messageRegister="Error: This email is already used or your passward is too short");
  }
  sendEmailVerification() {
    this.clearAllMessages ();
    firebase.auth().currentUser.sendEmailVerification()
    .then(_ => this.messageVerification="An email has been sent to you")
    .catch(err => this.messageVerification="Error: You need to login or register first");
  }

  editProfile () {
    this.clearAllMessages ();
    this.db.list('users/').update(this.currentUserID, {focusUserID:this.currentUserID})
    .then(_ => this.messageEditProfile="")
    .catch(err => this.messageEditProfile="Error: You need to login or register first");
    this.router.navigate(['userProfile']);
  }

  clearAllMessages () {
    this.messageLogin = "";
    this.messageLogout = "";
    this.messageRegister = "";
    this.messageVerification = "";
    this.messageEditProfile = "";
  }

}

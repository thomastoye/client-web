import { Component } from '@angular/core';
import { Router } from '@angular/router'
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

@Component({
  selector: 'login',
  template: `
  <div id="login">
  <div style="width:300px;display:block;margin: 0 auto;padding:25px;">
  <div style="font-size:25px;line-height:35px;color:#555">Public.</div>
  <div style="font-size:25px;line-height:35px;color:#555">Chat.</div>
  <div style="font-size:25px;line-height:35px;color:#555">And exchange.</div>
  <div style="font-size:25px;line-height:35px;color:#555">For everyone.</div>
  </div>
    <div class="module form-module">
      <div class="form">
        <form>
          <img (error)="errorHandler($event)" src="./../assets/App icons/PERRINN logo.png" style="width:70%">
          <div [hidden]="UI.currentUser!=null">
          <div style="text-align:right; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="newUser=!newUser;messageUser=''">{{newUser?"Already have an account?":"Need a new account?"}}</div>
          <input maxlength="500" [(ngModel)]="email" name="email" type="text" placeholder="Email *" (keyup)="messageUser=''" required/>
          <input maxlength="500" [(ngModel)]="password" name="password" type="password" placeholder="Password *" (keyup)="messageUser=''" required/>
          <button [hidden]="newUser" type="button" (click)="login(email,password)">Login</button>
          <div [hidden]="newUser" style="text-align:center; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="resetPassword(email)">Forgot password?</div>
          <div [hidden]="!newUser">
          <input maxlength="500" [(ngModel)]="passwordConfirm" name="passwordConfirm" type="password" placeholder="Confirm password *" (keyup)="messageUser=''"/>
          <input maxlength="500" [(ngModel)]="firstName" style="text-transform: lowercase;"  name="firstName" type="text" placeholder="First name *" (keyup)="messageUser=''"/>
          <input maxlength="500" [(ngModel)]="lastName" style="text-transform: lowercase;" name="lastName" type="text" placeholder="Last name *" (keyup)="messageUser=''"/>
          <button type="button" (click)="register(email,password,passwordConfirm,firstName,lastName,photoURL)">Register</button>
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
  `,
})

export class LoginComponent  {

  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  message: string;
  messageUser: string;
  newUser: boolean;

  constructor(public afAuth: AngularFireAuth, public router: Router, public db: AngularFireDatabase,  public UI: userInterfaceService, public DB: databaseService) {
    this.photoURL="./../assets/App icons/me.png";
    this.newUser=false;
    this.UI.currentTeam="";
    this.afAuth.authState.subscribe((auth) => {
      if (auth!=null) {
        this.router.navigate(['user',auth.uid]);
      }
    });
  }

  login(email: string, password: string) {
    this.afAuth.auth.signInWithEmailAndPassword(email, password).catch((error:firebase.FirebaseError)=>{
      var errorCode = error.code;
      var errorMessage = error.message;
      if (errorCode === 'auth/wrong-password') {
        this.messageUser='Wrong password.';
      } else {
        this.messageUser=errorMessage;
      }
    });
  }

  resetPassword(email: string) {
    this.afAuth.auth.sendPasswordResetEmail(email)
    .then(_ => this.messageUser="An email has been sent to you")
    .catch((error:firebase.FirebaseError)=>{
      var errorCode = error.code;
      var errorMessage = error.message;
      this.messageUser=errorMessage;
    });
  }

  logout() {
    this.afAuth.auth.signOut()
    .then(_ => this.messageUser="Successfully logged out")
    .catch(err => this.messageUser="You were not logged in");
  }

  register(email: string, password: string, passwordConfirm: string, firstName: string, lastName: string, photoURL: string) {
    if (email==null||password==null||passwordConfirm==null||firstName==null||lastName==null||photoURL==null) {
        this.messageUser="You need to fill all the fields";
    }
    else {
      if (password!=passwordConfirm) {
        this.messageUser="Verification password doesn't match";
      } else {
        firstName = firstName.toLowerCase();
        lastName = lastName.toLowerCase();
        this.afAuth.auth.createUserWithEmailAndPassword(email, password).catch((error:firebase.FirebaseError)=>{
          var errorCode = error.code;
          var errorMessage = error.message;
          if (errorCode == 'auth/weak-password') {
            this.messageUser='The password is too weak.';
          } else {
            this.messageUser=errorMessage;
          }
        }).then(_=> {
          this.afAuth.authState.subscribe((auth) => {
            this.db.list('users/'+auth.uid).push({
              timestamp:firebase.database.ServerValue.TIMESTAMP,
              firstName:firstName,
              lastName:lastName,
              photoURL:photoURL,
            }).then(_ => {
              var teamName = firstName+" "+lastName;
              this.createTeam(auth.uid, teamName);
            });
          });
        });
      }
    }
  }

  createTeam(userID: string, teamName: string) {
    teamName = teamName.toUpperCase();
    const now = Date.now();
    var teamID = this.db.list('ids/').push(true).key;
    this.db.list('teams/'+teamID).push({
      user:userID,
      name:teamName,
      addLeader:userID,
      timestamp:firebase.database.ServerValue.TIMESTAMP,
    });
    this.db.object('userTeams/'+userID+'/'+teamID).update({
      following:true,
      lastChatVisitTimestamp:now,
      lastChatVisitTimestampNegative:-1*now,
    });
    this.db.list('users/'+userID).push({
      timestamp:firebase.database.ServerValue.TIMESTAMP,
      personalTeam:teamID,
    });
  }

  errorHandler(event) {
    event.target.src = "https://storage.googleapis.com/perrinn-d5fc1.appspot.com/images%2Fthumb_1522405973933planet-earth-transparent-background-d-render-isolated-additional-file-high-quality-texture-realistic-70169166.jpg?GoogleAccessId=firebase-adminsdk-rh8x2@perrinn-d5fc1.iam.gserviceaccount.com&Expires=16756761600&Signature=fyOGQP1j7szg08kMxnoK4cT%2FNGDfxrW4rk1z3mmMD%2FExGHERqnSfAxAZXAKBVeaHGdRNHRczKws0pWQeQwLcpiiA9f5bSW0GgEot31eaBp5x691YSQ9dAQXmSodSJ9NAv5cxKQ1oHwPG4DA1YBvtKnx%2BVbtmW8%2BapFK17UgGBsr5qnu7Qz16bc4BDx3INwEeF5MghjTu39sd106Mkd7qklWle5Kvo45VKntGM2oWXNYJY%2FYIJbili0c725VgGSHZqW6V6FpYgBgrHkzRhGBObmqz4PFnKEsTUaaF8AsneCTUpm3ClC6knFzIN7btlh7rqbDRkTddv7l2bUhfIN%2FpqA%3D%3D";
  }

}

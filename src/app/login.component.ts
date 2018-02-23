import { Component } from '@angular/core';
import { Router } from '@angular/router'
import * as firebase from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2/database';
import { userInterfaceService } from './userInterface.service';

@Component({
  selector: 'login',
  template: `
  <div id="login">
    <div class="module form-module">
      <div class="form">
        <form>
          <img (error)="errorHandler($event)" src="./../assets/App icons/PERRINN logo.png" style="width:70%">
          <div [hidden]="UI.currentUser!=null">
          <div style="text-align:right; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="newUser=!newUser">{{newUser?"Already have an account?":"Need a new account?"}}</div>
          <input maxlength="500" [(ngModel)]="email" name="email" type="text" placeholder="Email *"/>
          <input maxlength="500" [(ngModel)]="password" name="password" type="password" placeholder="Password *"/>
          <button [hidden]="newUser" type="button" (click)="login(email,password)">Login {{messageLogin}}</button>
          <div style="text-align:center; font-size:10px; cursor:pointer; color:blue; padding:10px;" (click)="resetPassword(email)">Forgot password? {{messageResetPassword}}</div>
          <div [hidden]="!newUser">
          <input maxlength="500" [(ngModel)]="passwordConfirm" name="passwordConfirm" type="password" placeholder="Confirm password *"/>
          <input maxlength="500" [(ngModel)]="firstName" style="text-transform: lowercase;"  name="firstName" type="text" placeholder="First name *"/>
          <input maxlength="500" [(ngModel)]="lastName" style="text-transform: lowercase;" name="lastName" type="text" placeholder="Last name *"/>
          <button type="button" (click)="register(email,password,passwordConfirm,firstName,lastName,photoURL,resume)">Register {{messageRegister}}</button>
          </div>
          </div>
          <div [hidden]="UI.currentUser==null">
          <button type="button" (click)="logout()">Logout {{messageLogout}}</button>
          </div>
        </form>
      </div>
      <div class="cta"><a href='mailto:contactperrinn@gmail.com'>Contact PERRINN</a></div>
    </div>
  </div>
  <div class='sheet' style="margin-top:10px;cursor:pointer" (click)="router.navigate(['project','-Ks_OrDydv6PE4UkeNCf'])">
  <div style="float:right;padding:10px;font-size:10px;color:blue">read more</div>
  <img src="./../assets/App icons/world-map-blue.svg" style="float:left;height:40px;padding:5px">
  <div style="float:left;padding:10px;font-size:15px;color:#5378b2">"We are a Team."</div>
  </div>
  <ul class='listLight' style="max-width:620px;display:block;margin:0 auto">
    <li class='projectIcon' *ngFor="let project of teamProjects | async" (click)="router.navigate(['project',project.$key])">
      <img (error)="errorHandler($event)"[src]="getProjectPhotoURL(project.$key)" style="object-fit: cover; height:125px; width:125px;position:relative">
      <div style="height:25px;font-size:10px;line-height:10px">{{getProjectName(project.$key)}}</div>
    </li>
  </ul>
  `,
})

export class LoginComponent  {

  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  resume: string;
  message: string;
  messageRegister: string;
  messageVerification: string;
  messageLogout: string;
  messageLogin: string;
  messageResetPassword: string;
  newUser: boolean;
  teamProjects: FirebaseListObservable<any>;

  constructor(public afAuth: AngularFireAuth, public router: Router, public db: AngularFireDatabase,  public UI: userInterfaceService) {
    this.photoURL="./../assets/App icons/me.png";
    this.resume="About me";
    this.newUser = false;
    this.teamProjects = this.db.list('teamProjects/-Kp0TqKyvqnFCnLryKC1', {
      query:{
        orderByChild:'following',
        equalTo: true,
      }
    });
  }

  login(email: string, password: string) {
    this.newUser = false;
    this.clearAllMessages ();
    this.afAuth.auth.signInWithEmailAndPassword(email, password)
    .then(_ => this.messageLogin="Successfully logged in")
    .catch(err => this.messageLogin="Error: Verify your email and password or create a new account");
  }

  resetPassword(email: string) {
    this.clearAllMessages ();
    this.afAuth.auth.sendPasswordResetEmail(email)
    .then(_ => this.messageResetPassword="An email has been sent to you")
    .catch(err => this.messageResetPassword="Error: Enter a valid email");
  }

  logout() {
    this.clearAllMessages ();
    this.afAuth.auth.signOut()
    .then(_ => this.messageLogout="Successfully logged out")
    .catch(err => this.messageLogout="Error: You were not logged in");
  }

  register(email: string, password: string, passwordConfirm: string, firstName: string, lastName: string, photoURL: string, resume: string) {
    this.newUser = false;
    this.clearAllMessages ();
    if (email==null||password==null||passwordConfirm==null||!(password==passwordConfirm)||firstName==null||lastName==null||photoURL==null||resume==null) {
        this.messageRegister="Error: You need to fill all the fields";
    }
    else {
      firstName = firstName.toLowerCase();
      lastName = lastName.toLowerCase();
      this.afAuth.auth.createUserWithEmailAndPassword(email, password)
      .catch(err => this.messageRegister="Error: This email is already used or you haven't provided valid information")
      .then(_=> {
        this.afAuth.authState.subscribe((auth) => {
          this.db.list('users/'+auth.uid+'/edits').push({timestamp: firebase.database.ServerValue.TIMESTAMP, firstName: firstName, lastName: lastName, photoURL: photoURL, resume: resume})
          .catch(err => this.messageRegister="Error: We couldn't save your profile")
          .then(_ => {
            this.messageRegister="Successful registered";
            var teamName = "team " + firstName;
            this.createNewTeam(auth.uid, teamName);
          });
        });
      });
    }
  }

  createNewTeam(userID: string, teamName: string) {
    teamName = teamName.toUpperCase();
    var teamID = this.db.list('ids/').push(true).key;
    this.db.object('teamUsers/'+teamID+'/'+userID).update({member: true, leader: true});
    this.db.object('teams/'+teamID).update({name: teamName, organisation: "Family and Friends"});
    this.db.object('userTeams/'+userID+'/'+teamID).update({following: true, lastChatVisitTimestamp: firebase.database.ServerValue.TIMESTAMP});
  }

  clearAllMessages () {
    this.messageLogin = "";
    this.messageResetPassword = "";
    this.messageLogout = "";
    this.messageRegister = "";
    this.messageVerification = "";
  }

  getProjectPhotoURL (ID: string) :string {
    var output;
    this.db.object('projects/' + ID).subscribe(snapshot => {
      output = snapshot.photoURL;
    });
    return output;
  }

  getProjectName (ID: string) :string {
    var output;
    this.db.object('projects/' + ID).subscribe(snapshot => {
      output = snapshot.name;
    });
    return output;
  }

  errorHandler(event) {
    event.target.src = "https://static1.squarespace.com/static/5391fac1e4b07b6926545c34/t/54b948f4e4b0567044b6c023/1421428991081/";
  }

}

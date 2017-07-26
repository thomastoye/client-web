import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TeamSettingsComponent }  from './teamSettings.component';
import { MemberComponent }  from './member.component';
import { ChatComponent }  from './chat.component';
import { LoginComponent }  from './login.component';
import { UserProfileComponent }  from './userProfile.component';
import { AddMemberComponent }  from './addMember.component';
import { FollowTeamComponent }  from './followTeam.component';
import { WalletComponent }  from './wallet.component';
import { CreateTeamComponent }  from './createTeam.component';
import { CreateTransactionComponent }  from './createTransaction.component';
import { TeamProfileComponent }  from './teamProfile.component';
import { BuyCoins }  from './buyCoins.component';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

// Must export the config
export const firebaseConfig = {
  apiKey: "AIzaSyAoG3PvimV926EgWlGvpzXrZAkOi1uWdcs",
  authDodash: "perrinn-d5fc1.firebaseapp.com",
  databaseURL: "https://perrinn-d5fc1.firebaseio.com",
  storageBucket: "perrinn-d5fc1.appspot.com",
  messagingSenderId: "44958643568"
};

@NgModule({
  declarations: [
    AppComponent,
    TeamSettingsComponent,
    MemberComponent,
    ChatComponent,
    LoginComponent,
    UserProfileComponent,
    AddMemberComponent,
    FollowTeamComponent,
    WalletComponent,
    CreateTeamComponent,
    CreateTransactionComponent,
    TeamProfileComponent,
    BuyCoins,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

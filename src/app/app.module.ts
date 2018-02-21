import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TeamProfileComponent }  from './teamProfile.component';
import { ChatComponent }  from './chat.component';
import { LoginComponent }  from './login.component';
import { UserProfileComponent }  from './userProfile.component';
import { ProjectProfileComponent }  from './projectProfile.component';
import { SearchComponent }  from './search.component';
import { AddTeamComponent }  from './addTeam.component';
import { AddMemberComponent }  from './addMember.component';
import { FollowProjectComponent }  from './followProject.component';
import { WalletComponent }  from './wallet.component';
import { CreateTeamComponent }  from './createTeam.component';
import { CreateProjectComponent }  from './createProject.component';
import { CreateTransactionComponent }  from './createTransaction.component';
import { BuyCoinsComponent }  from './buyCoins.component';
import { COINinfoComponent }  from './COINinfo.component';
import { LinkyModule } from 'angular-linky';

import { userInterfaceService } from './userInterface.service';
import { databaseService } from './database.service';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

import { Ng2ImgMaxModule } from 'ng2-img-max';

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
    TeamProfileComponent,
    ChatComponent,
    LoginComponent,
    UserProfileComponent,
    ProjectProfileComponent,
    SearchComponent,
    AddTeamComponent,
    AddMemberComponent,
    FollowProjectComponent,
    WalletComponent,
    CreateTeamComponent,
    CreateProjectComponent,
    CreateTransactionComponent,
    BuyCoinsComponent,
    COINinfoComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AppRoutingModule,
    LinkyModule,
    Ng2ImgMaxModule,
  ],
  providers: [
    userInterfaceService,
    databaseService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

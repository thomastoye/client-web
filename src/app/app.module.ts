import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TeamProfileComponent }  from './teamProfile.component';
import { ChatComponent }  from './chat.component';
import { LoginComponent }  from './login.component';
import { UserProfileComponent }  from './userProfile.component';
import { UserSettingsComponent }  from './userSettings.component';
import { SearchComponent }  from './search.component';
import { HelpComponent }  from './help.component';
import { BuyCoinsComponent }  from './buyCoins.component';
import { LinkyModule } from 'angular-linky';

import { userInterfaceService } from './userInterface.service';
import { ScrollableDirective } from './scrollable.directive';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth';

import { Ng2ImgMaxModule } from 'ng2-img-max';

// Must export the config
export const firebaseConfig = {
  apiKey: 'AIzaSyAoG3PvimV926EgWlGvpzXrZAkOi1uWdcs',
  authDodash: 'perrinn-d5fc1.firebaseapp.com',
  databaseURL: 'https://perrinn-d5fc1.firebaseio.com',
  storageBucket: 'perrinn-d5fc1.appspot.com',
  projectId: 'perrinn-d5fc1',
  messagingSenderId: '44958643568'
};

@NgModule({
  declarations: [
    AppComponent,
    TeamProfileComponent,
    ChatComponent,
    LoginComponent,
    UserProfileComponent,
    UserSettingsComponent,
    SearchComponent,
    HelpComponent,
    BuyCoinsComponent,
    ScrollableDirective,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule.enablePersistence({experimentalTabSynchronization:true}),
    AngularFireStorageModule,
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AppRoutingModule,
    LinkyModule,
    Ng2ImgMaxModule,
  ],
  providers: [
    userInterfaceService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { LoginComponent }   from './login.component';
import { ChatComponent } from './chat.component';
import { TeamProfileComponent } from './teamProfile.component';
import { UserProfileComponent } from './userProfile.component';
import { UserSettingsComponent } from './userSettings.component';
import { SearchComponent } from './search.component';
import { HelpComponent } from './help.component';
import { BuyCoinsComponent } from './buyCoins.component';

const appRoutes: Routes = [
  { path: 'chat/:id', component: ChatComponent },
  { path: 'team/:id', component: TeamProfileComponent },
  { path: 'user/:id', component: UserProfileComponent },
  { path: 'userSettings/:id', component: UserSettingsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'search', component: SearchComponent },
  { path: 'help', component: HelpComponent },
  { path: 'buyCoins', component: BuyCoinsComponent },
  { path: '',   redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: LoginComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}

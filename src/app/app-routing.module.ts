import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { LoginComponent }   from './login.component';
import { ChatComponent } from './chat.component';
import { UserProfileComponent } from './userProfile.component';
import { TeamSettingsComponent } from './teamSettings.component';
import { AddMemberComponent } from './addMember.component';
import { FollowTeamComponent } from './followTeam.component';
import { WalletComponent } from './wallet.component';
import { CreateTeamComponent } from './createTeam.component';
import { TeamProfileComponent } from './teamProfile.component';

const appRoutes: Routes = [
  { path: 'chat', component: ChatComponent },
  { path: 'userProfile', component: UserProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'teamSettings', component: TeamSettingsComponent },
  { path: 'addMember', component: AddMemberComponent },
  { path: 'followTeam', component: FollowTeamComponent },
  { path: 'wallet', component: WalletComponent },
  { path: 'createTeam', component: CreateTeamComponent },
  { path: 'teamProfile', component: TeamProfileComponent },
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

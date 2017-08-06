import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { LoginComponent }   from './login.component';
import { ChatComponent } from './chat.component';
import { MembersComponent } from './members.component';
import { UserProfileComponent } from './userProfile.component';
import { ProjectProfileComponent } from './projectProfile.component';
import { TeamSettingsComponent } from './teamSettings.component';
import { AddMemberComponent } from './addMember.component';
import { FollowTeamComponent } from './followTeam.component';
import { FollowProjectComponent } from './followProject.component';
import { WalletComponent } from './wallet.component';
import { CreateTeamComponent } from './createTeam.component';
import { CreateProjectComponent } from './createProject.component';
import { CreateTransactionComponent } from './createTransaction.component';
import { TeamProfileComponent } from './teamProfile.component';
import { BuyCoins } from './buyCoins.component';

const appRoutes: Routes = [
  { path: 'chat', component: ChatComponent },
  { path: 'members', component: MembersComponent },
  { path: 'userProfile', component: UserProfileComponent },
  { path: 'projectProfile', component: ProjectProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'teamSettings', component: TeamSettingsComponent },
  { path: 'addMember', component: AddMemberComponent },
  { path: 'followTeam', component: FollowTeamComponent },
  { path: 'followProject', component: FollowProjectComponent },
  { path: 'wallet', component: WalletComponent },
  { path: 'createTeam', component: CreateTeamComponent },
  { path: 'createProject', component: CreateProjectComponent },
  { path: 'createTransaction', component: CreateTransactionComponent },
  { path: 'teamProfile', component: TeamProfileComponent },
  { path: 'buyCoins', component: BuyCoins },
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

import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { LoginComponent }   from './login.component';
import { ChatComponent } from './chat.component';
import { UsersComponent } from './users.component';
import { UserProfileComponent } from './userProfile.component';
import { ProjectProfileComponent } from './projectProfile.component';
import { TeamsComponent } from './teams.component';
import { AddMemberComponent } from './addMember.component';
import { AddTeamComponent } from './addTeam.component';
import { FollowTeamComponent } from './followTeam.component';
import { FollowProjectComponent } from './followProject.component';
import { WalletComponent } from './wallet.component';
import { CreateTeamComponent } from './createTeam.component';
import { CreateProjectComponent } from './createProject.component';
import { CreateTransactionComponent } from './createTransaction.component';
import { BuyCoins } from './buyCoins.component';
import { COINinfo } from './COINinfo.component';
import { TeamAds } from './teamAds.component';

const appRoutes: Routes = [
  { path: 'chat', component: ChatComponent },
  { path: 'users', component: UsersComponent },
  { path: 'userProfile', component: UserProfileComponent },
  { path: 'projectProfile', component: ProjectProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'teams', component: TeamsComponent },
  { path: 'addMember', component: AddMemberComponent },
  { path: 'addTeam', component: AddTeamComponent },
  { path: 'followTeam', component: FollowTeamComponent },
  { path: 'followProject', component: FollowProjectComponent },
  { path: 'wallet', component: WalletComponent },
  { path: 'createTeam', component: CreateTeamComponent },
  { path: 'createProject', component: CreateProjectComponent },
  { path: 'createTransaction', component: CreateTransactionComponent },
  { path: 'buyCoins', component: BuyCoins },
  { path: 'COINinfo', component: COINinfo },
  { path: 'teamAds', component: TeamAds },
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

import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { LoginComponent }   from './login.component';
import { ChatComponent } from './chat.component';
import { TeamProfileComponent } from './teamProfile.component';
import { UserProfileComponent } from './userProfile.component';
import { ProjectProfileComponent } from './projectProfile.component';
import { SearchComponent } from './search.component';
import { AddTeamComponent } from './addTeam.component';
import { AddMemberComponent } from './addMember.component';
import { FollowProjectComponent } from './followProject.component';
import { WalletComponent } from './wallet.component';
import { CreateTeamComponent } from './createTeam.component';
import { CreateProjectComponent } from './createProject.component';
import { CreateTransactionComponent } from './createTransaction.component';
import { BuyCoinsComponent } from './buyCoins.component';
import { COINinfoComponent } from './COINinfo.component';
import { TeamAdsComponent } from './teamAds.component';
import { LinksComponent } from './links.component';

const appRoutes: Routes = [
  { path: 'chat/:id', component: ChatComponent },
  { path: 'team/:id', component: TeamProfileComponent },
  { path: 'user/:id', component: UserProfileComponent },
  { path: 'project/:id', component: ProjectProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'search', component: SearchComponent },
  { path: 'addTeam', component: AddTeamComponent },
  { path: 'addMember', component: AddMemberComponent },
  { path: 'followProject', component: FollowProjectComponent },
  { path: 'wallet/:id', component: WalletComponent },
  { path: 'createTeam', component: CreateTeamComponent },
  { path: 'createProject', component: CreateProjectComponent },
  { path: 'createTransaction', component: CreateTransactionComponent },
  { path: 'buyCoins', component: BuyCoinsComponent },
  { path: 'COINinfo', component: COINinfoComponent },
  { path: 'teamAds', component: TeamAdsComponent },
  { path: 'links/:id', component: LinksComponent },
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

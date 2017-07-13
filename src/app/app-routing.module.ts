import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { LoginComponent }   from './login.component';
import { ChatComponent } from './chat.component';
import { UserComponent } from './user.component';
import { TeamComponent } from './team.component';
import { AddMemberComponent } from './addMember.component';
import { FollowTeamComponent } from './followTeam.component';
import { WalletComponent } from './wallet.component';

const appRoutes: Routes = [
  { path: 'chat', component: ChatComponent },
  { path: 'user', component: UserComponent },
  { path: 'login', component: LoginComponent },
  { path: 'team', component: TeamComponent },
  { path: 'addMember', component: AddMemberComponent },
  { path: 'followTeam', component: FollowTeamComponent },
  { path: 'wallet', component: WalletComponent },
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

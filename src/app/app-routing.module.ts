import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './pages/game/game.component';
import { HelpComponent } from './pages/help/help.component';

const routes: Routes = [
  {path: '', component: GameComponent},
  {path: 'help', component: HelpComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

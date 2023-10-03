import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './store';
import { GameboardComponent } from './components/gameboard/gameboard.component';
import { GameComponent } from './pages/game/game.component';
import { HelpComponent } from './pages/help/help.component';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { ReactiveFormsModule } from '@angular/forms';
import { MinuteSecondsPipe } from './utils/minute-seconds-pipe';

@NgModule({
  declarations: [
    AppComponent,
    GameboardComponent,
    GameComponent,
    HelpComponent,
    MinuteSecondsPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: true,
        strictStateSerializability: false,
        strictActionSerializability: false,
        strictActionWithinNgZone: false,
        strictActionTypeUniqueness: false,
      },
    }),
    StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production }),
    EffectsModule.forRoot([]),
    StoreRouterConnectingModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

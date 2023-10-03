import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { environment } from '../../environments/environment';
import * as fromGame from './game.reducer';

export interface State {
  [fromGame.gameFeatureKey]: fromGame.State;
}

export const reducers: ActionReducerMap<State> = {
  [fromGame.gameFeatureKey]: fromGame.reducer,
};


export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];

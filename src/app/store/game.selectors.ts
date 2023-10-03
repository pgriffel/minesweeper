import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Game } from '../domain/game';
import { gameFeatureKey, State } from './game.reducer';


export const gameFeature = createFeatureSelector<State>(gameFeatureKey);


export const selectGame = createSelector(
    gameFeature,
    (state: State) => state.game
)


export const selectSettings = createSelector(
    selectGame,
    (game: Game) => game.settings
)
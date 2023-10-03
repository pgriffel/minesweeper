import { createReducer, on } from '@ngrx/store';
import { Game } from '../domain/game';
import { cellOpened, cellFlagged, settingsChanged } from './game.actions';


export const gameFeatureKey = 'game';

export interface State {
  game: Game
}

export const initialState: State = {
  game: Game.create(6, 6, 6)
};


export const reducer = createReducer(
  initialState,
  on(cellOpened, (state, action) => ({game: state.game.openCell(action.position)})),
  on(cellFlagged, (state, action) => ({game: state.game.flagCell(action.position)})),
  on(settingsChanged, (_, action) => ({game: Game.create(action.rows, action.columns, action.bombs)}))
);
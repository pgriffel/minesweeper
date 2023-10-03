import { createAction, props } from '@ngrx/store';
import { GameSettings } from '../domain/game';
import { Position } from '../utils/grid';


export const cellOpened = createAction(
  '[Game] Cell opened',
  props<{ position: Position }>()
);

export const cellFlagged = createAction(
  '[Game] Cell flagged',
  props<{ position: Position }>()
);

export const settingsChanged = createAction(
  '[Game] Settings changed',
  props<GameSettings>()
);

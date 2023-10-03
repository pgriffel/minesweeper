import { Game } from "../domain/game";
import { selectSettings } from "./game.selectors";


describe('Game Selectors', () => {
  it('should select the feature state', () => {
    const game = Game.create(1, 3, 2);
    expect(selectSettings.projector(game)).toEqual({rows: 1, columns: 3, bombs: 2});
  });
});

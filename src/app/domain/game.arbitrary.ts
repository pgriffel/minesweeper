import fc, { Arbitrary } from "fast-check";
import { Position } from "../utils/grid";
import { Game, GameAction, GameSettings } from "./game";


/**
 * Arbitrary game settings. The result contains all suitable arguments to Game.create
 * 
 * @returns A fast-check arbitrary 
 */
export function arbitrarySettings(): Arbitrary<GameSettings> {
    return fc.tuple(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 })
    ).chain(([rows, columns]) => fc.record({
        rows: fc.constant(rows), 
        columns: fc.constant(columns), 
        bombs: fc.integer({ min: 0, max: rows * columns })
    }));
}


/**
 * An aribtrary gameboard position
 * 
 * @param dimensions The game board dimensions 
 * @returns A fast-check arbitrary
 */
export function arbitraryPosition(dimensions: { rows: number, columns: number }): Arbitrary<Position> {
    return fc.tuple(
        fc.integer({ min: 0, max: dimensions.rows - 1 }),
        fc.integer({ min: 0, max: dimensions.columns - 1 })
    ).map(([row, column]) => Position.from(row, column));
}


/**
 * An aribtrary flag or open action
 * 
 * @param dimensions The game board dimensions 
 * @returns A fast-check arbitrary
 */
export function arbitraryAction(dimensions: { rows: number, columns: number }): Arbitrary<GameAction> {
    return fc.record({
        kind: fc.constantFrom('open', 'flag'),
        position: arbitraryPosition(dimensions)
    })
}


/**
 * An aribtrary game
 * 
 * @returns A fast-check arbitrary
 */
export function arbitraryGame(): Arbitrary<Game> {
    return arbitrarySettings().chain((settings) => {
        return fc.array(arbitraryAction(settings)).map((actions) => {
            return actions.reduce(
                (game, action) =>
                    action.kind === 'flag' ? game.flagCell(action.position) : game.openCell(action.position),
                Game.create(settings.rows, settings.columns, settings.bombs))
        });
    })
}

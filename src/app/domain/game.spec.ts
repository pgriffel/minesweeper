import fc from "fast-check";
import { Position } from "../utils/grid";
import { closure, equiv, Relation } from "../utils/relation";
import { Game } from "./game";
import { arbitraryGame, arbitraryPosition, arbitrarySettings } from "./game.arbitrary";


describe('Game', () => {

    describe('dimensions', () => {

        it('should be correct for a newly created game', () => {
            fc.assert(fc.property(arbitrarySettings(), (settings) => {

                // When a game is created from arbitrary settings
                const game = Game.create(settings.rows, settings.columns, settings.bombs)

                // Then the game dimensions are correct
                expect(game.nrRows()).toEqual(settings.rows);
                expect(game.nrColumns()).toEqual(settings.columns);
            }))
        });

        it('should be unchanged after opening a cell', () => {
            fc.assert(fc.property(arbitraryGame().chain(game => fc.tuple(
                fc.constant(game),
                arbitraryPosition(game.settings))),
                ([prev, position]: [Game, Position]) => {

                    // When a cell is opened
                    const next = prev.openCell(position);

                    // Then the game dimensions are unchanged
                    expect(next.nrRows()).toEqual(prev.nrRows());
                    expect(next.nrColumns()).toEqual(prev.nrColumns());
                }
            ), { numRuns: 1000 })
        });

        it('should be unchanged after flagging a cell', () => {
            fc.assert(fc.property(arbitraryGame().chain(game => fc.tuple(
                fc.constant(game),
                arbitraryPosition(game.settings))),
                ([prev, position]: [Game, Position]) => {

                    // When a cell is flagged
                    const next = prev.flagCell(position);

                    // Then the game dimensions are unchanged
                    expect(next.nrRows()).toEqual(prev.nrRows());
                    expect(next.nrColumns()).toEqual(prev.nrColumns());
                }
            ))
        });
    });


    describe('allPositions', () => {

        it('should give all positions for any game', () => {
            fc.assert(fc.property(arbitraryGame(), (game: Game) => {
                const allPositions = [];
                for (let column = 0; column < game.nrColumns(); column++) {
                    for (let row = 0; row < game.nrRows(); row++) {
                        allPositions.push(Position.from(row, column));
                    }
                }
                expect(game.allPositions().map(p => p.id).sort()).toEqual(allPositions.map(p => p.id).sort());
            }))
        });
    });


    describe('game status and cellInfo', () => {

        it('should show status initial and all cells as closed for a newly created game', () => {

            fc.assert(fc.property(arbitrarySettings(), (settings) => {

                // When a game is created from arbitrary settings
                const game = Game.create(settings.rows, settings.columns, settings.bombs)

                // Then the game status is initial
                expect(game.status()).toEqual('initial');

                // And each cell is closed and unflagged and no bombs exist yet
                game.allPositions().forEach(position => {
                    const info = game.cellInfo(position);
                    expect(info.opened).toBeFalse();
                    expect(info.flagged).toBeFalse();
                    expect(info.hot).toBeFalse();
                    expect(info.label).toEqual(' ');
                })

            }))
        });

        it('should change correctly after an open action', () => {

            fc.assert(fc.property(arbitraryGame().chain(game => fc.tuple(
                fc.constant(game),
                arbitraryPosition(game.settings))),
                ([prev, position]: [Game, Position]) => {

                    // Cell info at the opened position
                    const cellPrev = prev.cellInfo(position);

                    // When a cell is opened
                    const next = prev.openCell(position);

                    // Dev log of the action
                    logStateChange(prev, next);

                    // Then the status and cell info are correct
                    if (cellPrev.flagged || cellPrev.opened) {

                        // Nothing is changed if the cell was already open or flagged
                        expect(next).toEqual(prev);


                    } else if (cellPrev.hot) {

                        // The game is over if the user clicks a bomb
                        expect(next.status()).toEqual('lost');
                        expect(next.allPositions().every(pos => next.cellInfo(pos).opened)).toBeTrue();
                        
                    } else {

                        // Determine some required information
                        const reachable = zeroReachable(next);
                        const firstMove = prev.allPositions().every(pos => !prev.cellInfo(pos).opened);
                        const won = next.allPositions().every(p => 
                            next.cellInfo(p).hot || prev.cellInfo(p).opened || reachable.at(position, p) || equiv(position, p));

                        // Expect the game status to be correct
                        expect(next.status()).toEqual(won ? 'won' : 'running');

                        for (const pos of next.allPositions()) {

                            // Get the previous and next cell info
                            const cellPrev = prev.cellInfo(pos);
                            const cellNext = next.cellInfo(pos);

                            // Check the opened status
                            const openedOkay = cellNext.opened ===
                                (won || cellPrev.opened || equiv(position, pos) || reachable.at(position, pos));

                            // Check the flagged status
                            const flaggedOkay = 
                                won || (cellNext.flagged === (cellPrev.flagged && !firstMove && !reachable.at(position, pos)));

                            // Check that the bombs stay the same
                            const hotOkay = firstMove || cellPrev.hot === cellNext.hot

                            // Check the number of bombs
                            const nrBombs = next.allPositions().filter(p => next.cellInfo(p).hot).length;
                            const bombsOkay = nrBombs === next.settings.bombs;

                            // Print some debug info on failure
                            if (!openedOkay || !flaggedOkay || !hotOkay || !bombsOkay) {
                                console.log(`Opened failure at ${pos.id} when opening ${position.id}`);
                                logStateChange(prev, next);
                            }

                            // Expect all checks to be okay
                            expect(openedOkay).toBeTrue();
                            expect(flaggedOkay).toBeTrue();
                            expect(hotOkay).toBeTrue();
                            expect(bombsOkay).toBeTrue();    
                        }

                    }
                }
            ), { numRuns: 1000 })
        });

        it('should change correctly after a flag action', () => {

            fc.assert(fc.property(arbitraryGame().chain(game => fc.tuple(
                fc.constant(game),
                arbitraryPosition(game.settings))),
                ([prev, position]: [Game, Position]) => {

                    // When a cell is flagged
                    const next = prev.flagCell(position);

                    for (const pos of next.allPositions()) {

                        const cellPrev = prev.cellInfo(pos);
                        const cellNext = next.cellInfo(pos);

                        // Then no cell is opened and the bombs and hints are unchanged
                        expect(cellNext.hot).toEqual(cellPrev.hot);
                        expect(cellNext.hint).toEqual(cellPrev.hint);
                        expect(cellNext.opened).toEqual(cellPrev.opened);

                        // And the flagged status in the clicked cell is toggled if it 
                        // wasn't already opened. All other cells remain unchanged.
                        const mustToggle = equiv(pos, position) && !cellPrev.opened;
                        expect(cellNext.flagged).toEqual(mustToggle ? !cellPrev.flagged : cellPrev.flagged);
                    }
                }
            ))
        });
    });

});


/**
 * Relationship between grid positions that says whether a cell is opened or not when some 
 * cell is opened. A cell is opened when it is a zero cell that is connected via other 
 * zero cells to the opened cells, or it is any direct neighbour (not containing a bomb!)
 * of such a zero cell.
 * 
 * zeroReachable(opened, other)  <=>  
 *   Exists x, y: 
 *     (equiv(x, opened) or neighbour(x, opened)) and
 *     not(hot(x)) and
 *     zeroNeighbours*(x, y) and
 *     (equiv(y, other) or neighbour(y, other))
 * 
 * where
 *  
 * zeroNeighbours(x, y)  <=>  
 *   hints.get(x) === 0 and
 *   hints.get(y) === 0 and 
 *   neighbours(x, y)
 * 
 * @param game A minesweeper game
 * @returns A relation of pairs (x, y) with x the opened cell and y the other cell that opens as a consequence.
 */
function zeroReachable(game: Game): Relation<Position, Position> {

    const positions = game.allPositions();

    const zeroNeighbours = {
        domain: positions,
        range: positions,
        at: (x: Position, y: Position) => {
            return game.cellInfo(x).hint === 0 &&
                game.neighbours(x).concat(x).some(n => equiv(y, n) && game.cellInfo(n).hint === 0)
        }
    }

    const zeroConnected = closure(zeroNeighbours);

    return {
        domain: positions,
        range: positions,
        at: (x: Position, y: Position) => {
            const validNeighbours = game.neighbours(x).concat(x).filter(n => !game.cellInfo(n).hot)
            const others = game.neighbours(y).concat(y)
            return validNeighbours.some(n => others.some(o => zeroConnected.at(o, n)))
        }
    }
}


/**
 * Dev tool to log game state changes
 */
function logStateChange(prev: Game, next: Game) {
    console.log('prev', prev.printBoard());
    console.log('next', next.printBoard());
    console.log('moves', next.history.map(move => `${move.kind} ${move.position.id}`));
}
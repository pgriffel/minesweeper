import { Grid, Position } from "../utils/grid";
import { equiv } from "../utils/relation";

export type GameSettings = {
  rows: number;
  columns: number;
  bombs: number;
};

export type GameAction = {
  kind: "open" | "flag";
  position: Position;
};

export interface CellInfo {
  row: number;
  column: number;
  opened: boolean;
  flagged: boolean;
  hot: boolean;
  hint: number;
  label: string;
}

export type GameStatus = "initial" | "running" | "won" | "lost";

export class Game {
  /**
   * Dev hack that shows the bombs
   */
  private readonly cheat = true;

  /**
   * The game state can be divided into four parts:
   * 1. Settings
   * 2. The history of the player actions
   * 3. Time info: optional start and end date
   * 4. Various properties per grid cell: hot, hints, opened and flagged
   *
   * The opened, flagged and hint grids could in principle be computed from
   * the hot grid and the history, but they are cached for efficiency.
   *
   * @param settings Game parameters like grid size and number of bombs.
   * @param history Array of all user actions
   * @param time Time info for the game
   * @param hot Does a cell contain a bomb?
   * @param hints The number of cell neigbours that contain a bomb
   * @param opened Is the cell opened? By the player, or by the game in the case of zero cells
   * @param flagged Is the cell flagged by the player?
   */
  private constructor(
    public readonly settings: GameSettings,
    public readonly history: GameAction[],
    private readonly time: { start?: Date; end?: Date },
    private readonly hot: Grid<boolean>,
    private readonly hints: Grid<number>,
    private readonly opened: Grid<boolean>,
    private readonly flagged: Grid<boolean>
  ) {}

  // Dispatch game geometry getters to one of the grids

  public rowIndices(): number[] {
    return this.hot.rowIndices();
  }

  public columnIndices(): number[] {
    return this.hot.columnIndices();
  }

  public allPositions(): Position[] {
    return this.hot.allPositions();
  }

  public nrRows(): number {
    return this.hot.nrRows();
  }

  public nrColumns(): number {
    return this.hot.nrColumns();
  }

  public neighbours(position: Position): Position[] {
    return this.hot.neighbours(position);
  }

  /**
   * Status of the game. The game moves from 'initial' to 'running' to
   * 'won' or 'lost'. The 'running' status starts after the first open.
   *
   * @returns The current status
   */
  public status(): GameStatus {
    if (this.time.start && this.time.end) {
      return this.hot.get(this.history.at(-1)!.position) ? "lost" : "won";
    }
    if (this.time.start) {
      return "running";
    }
    return "initial";
  }

  /**
   * Information about a single cell
   *
   * @param position The position of the cell
   * @returns Various info about the cell at the given position
   */
  public cellInfo(position: Position): CellInfo {
    return {
      row: position.row,
      column: position.column,
      opened: this.opened.get(position),
      flagged: this.flagged.get(position),
      hot: this.hot.get(position),
      hint: this.hints.get(position),
      label: this.label(position),
    };
  }

  /**
   * How many cells does a player still have to open?
   *
   * @returns The number of unopened cells without a bomb
   */
  public stillToOpen(): number {
    // The max with 0 handles the final state where all cells are open, including the ones
    // with a bomb or a flag
    return Math.max(0, this.unopened(this.opened) - this.settings.bombs);
  }

  /**
   * Elapsed game time in milliseconds. Sees if start and end time are available
   * and computes the appropriate result.
   */
  public gameTime(): number {
    // Game is finished
    if (this.time.end && this.time.start) {
      return this.time.end.getTime() - this.time.start.getTime();
    }

    // Game is running
    if (this.time.start) {
      return new Date().getTime() - this.time.start.getTime();
    }

    // First cell hasn't been clicked yet.
    return 0;
  }

  /**
   * Prints the game board in a human readable form. For dev purposes only.
   *
   * @returns An ascii representation of the game board
   */
  public printBoard(): string {
    let out = `\n${this.nrRows()}x${this.nrColumns()}, ${
      this.settings.bombs
    } bomb(s), ${this.status()}\n`;

    out += " ";
    for (let column of this.columnIndices()) {
      out += " " + column;
    }
    out += "\n";
    for (let row of this.rowIndices()) {
      out += row;
      out += "|";
      for (let column of this.columnIndices()) {
        out += this.label(Position.from(row, column), true);
        out += "|";
      }
      out += "\n";
    }
    return out;
  }

  /**
   * A single character label for a cell. Used for printing. Currently also used
   * in the gameboard component to display the cell. Change that!?
   *
   * @param position The cell's position
   * @param ascii Is the label used for terminal output?
   * @returns A string of length 1
   */
  private label(position: Position, ascii: boolean = false): string {
    if (
      this.flagged.get(position) &&
      this.opened.get(position) &&
      !this.hot.get(position)
    ) {
      return "x";
    }
    if (this.flagged.get(position)) {
      return `\u{2691}`;
    }
    if (this.opened.get(position)) {
      if (this.hot.get(position)) {
        return `\u{1F4A3}`;
      }
      const hint = this.hints.get(position);
      return hint == 0 ? " " : hint.toString();
    }
    if (this.cheat && this.hot.get(position)) {
      return "*";
    }
    return ascii ? "." : " ";
  }

  /**
   * Called when the player flags a cell.
   *
   * @param position Position of the cell to flag
   * @returns A new game with the cell flagged
   */
  public flagCell(position: Position): Game {
    // If the cell is already open then this becomes a noop. Just
    // return this game unchanged.
    if (this.opened.get(position)) {
      return this;
    }

    // Return a new game with the clicked flag toggled.
    return new Game(
      this.settings,
      this.history.concat({ kind: "flag", position }),
      this.time,
      this.hot,
      this.hints,
      this.opened,
      this.flagged.map((val, pos) => (equiv(pos, position) ? !val : val))
    );
  }

  /**
   * Called when the player opens a cell. Checks for edge cases and
   * calls doOpen to do the actual work in the normal case. On the
   * first click it generates a new random game. When the user clicks
   * a bomb it ends the game.
   *
   * @param position
   * @returns
   */
  public openCell(position: Position): Game {
    // If the cell is already open or it is flagged then this becomes
    // a noop. Just return this game unchanged.
    if (this.opened.get(position) || this.flagged.get(position)) {
      return this;
    }

    // If the player hits a bomb then we go to game over
    if (this.hot.get(position)) {
      return this.endGame(position);
    }

    // If this is the first open then we have to generate a fresh game instead of this game
    const game =
      this.opened.count((open) => open) === 0
        ? this.generateHotGame(position)
        : this;

    // Do the actual open. Note that it is always valid because generateHotGame makes sure not
    // to put a bomb on the clicked position.
    return game.doOpen(position);
  }

  /**
   * Helper for openCell that is called when the open is valid. Opens the cell and all cells that
   * are reachable via cells with hint zero.
   *
   * @param position The position to open
   * @returns A new game with all changes made.
   */
  private doOpen(position: Position): Game {
    // Open the clicked cell
    // let opened = this.opened.map((val, pos) => val || equiv(pos, position));
    let opened = this.opened;

    // Open all cells with hint zero that can be reached from the opened cell.
    opened = this.openZeros(opened, position);

    // Open any cell that neighbours an open cell with hint zero.
    opened = opened.map(
      (val, pos) =>
        val ||
        this.hints
          .neighbours(pos)
          .some((p) => this.hints.get(p) === 0 && opened.get(p))
    );

    // If the player opened all cells without a bomb, then the game is won.
    if (this.unopened(opened) === this.settings.bombs) {
      return this.endGame(position);
    }

    // Otherwise create a new game with a move added and the opened state updated. Remove
    // any flags from opened cells.
    return new Game(
      this.settings,
      this.history.concat({ kind: "open", position }),
      this.time,
      this.hot,
      this.hints,
      opened,
      this.flagged.map((flagged, pos) => flagged && !opened.get(pos))
    );
  }

  /**
   * Helper for doOpen. Recursively opens cells with hint zero. Ignore cells with a bomb!
   *
   * @param opened The currently open cells
   * @param position The position clicked by the player
   * @returns A copy of open with possibly additional cells opened
   */
  private openZeros(opened: Grid<boolean>, position: Position): Grid<boolean> {
    const copy = opened.map((val) => val);
    let todo = [position];
    let pos = todo.pop();
    while (pos !== undefined) {
      if (!copy.get(pos) && !this.hot.get(pos)) {
        copy.set(pos, true);
        copy
          .neighbours(pos)
          .filter((p) => this.hints.get(p) === 0)
          .forEach((n) => {
            todo.push(n);
          });
      }
      pos = todo.pop();
    }
    return copy;
  }

  /**
   * The number of cells that have not been opened. Equals the total grid size
   * minus the number of opened cells.
   *
   * @param opened Is a cell open?
   * @returns The number of unopened cells
   */
  private unopened(opened: Grid<boolean>): number {
    return this.nrRows() * this.nrColumns() - opened.count((open) => open);
  }

  /**
   * Constructs a new empty game with randomly places bombs.
   *
   * Computes the hints, removes any flags and sets the start date. The moves are empty and no
   * cells are opened yet. It is assumed the caller does the open at the given position.
   *
   * @param position No bombs are placed at this position.
   * @returns A new game
   */
  private generateHotGame(position: Position): Game {
    const hot = this.generateBombGrid(
      this.nrRows(),
      this.nrColumns(),
      this.settings.bombs,
      position
    );

    return new Game(
      this.settings,
      this.history,
      { start: new Date() },
      hot,
      this.hints.map(
        (_, pos) => hot.neighbours(pos).filter((n) => hot.get(n)).length
      ),
      this.opened,
      this.flagged.map((_) => false) // Remove any flags
    );
  }

  /**
   * Helper for generateHotBoard. Generates a hot grid with randomly placed bombs.
   *
   * @param rows The number of rows
   * @param columns The number of columns
   * @param bombs The number of bombs
   * @param exclude No bombs are placed at this position
   * @returns A random boolean grid with the amount of true entries equal to argument bombs
   */
  private generateBombGrid(
    rows: number,
    columns: number,
    bombs: number,
    exclude: Position
  ): Grid<boolean> {
    const loopDown = rows * columns < 2 * bombs;
    const delta = loopDown ? -1 : 1;
    let hot = Grid.initial(rows, columns).map(
      (_, pos) => loopDown && !equiv(pos, exclude)
    );
    let nrHot = loopDown ? rows * columns - 1 : 0;
    while (nrHot != bombs) {
      const pos = Position.from(
        Math.floor(Math.random() * rows),
        Math.floor(Math.random() * columns)
      );
      if (hot.get(pos) === loopDown && !equiv(pos, exclude)) {
        hot.set(pos, !loopDown);
        nrHot += delta;
      }
    }
    return hot;
  }

  /**
   * Stops the game because the player won or lost. Records the final
   * move, opens all cells and records the end time.
   *
   * @param position The last position that the player clicked.
   * @returns A new game with the new status
   */
  private endGame(position: Position): Game {
    return new Game(
      this.settings,
      this.history.concat({ kind: "open", position }),
      { ...this.time, end: new Date() },
      this.hot,
      this.hints,
      this.opened.map((_) => true),
      this.flagged
    );
  }

  /**
   * Constructs a new minesweeper game.
   *
   * @param rows The number of rows of the minesweeper grid, Must be at least one.
   * @param columns  The number of columns of the minesweeper grid. Must be at least one.
   * @param bombs  The number of bombs to generate
   * @returns A new Game instance
   */
  static create(rows: number, columns: number, bombs: number): Game {
    // Create an empty grid of the right dimensions
    const emptyGrid = Grid.initial(rows, columns);

    // Create the various initial grids used by the game
    const hot = emptyGrid.map((_) => false);
    const opened = emptyGrid.map((_) => false);
    const flagged = emptyGrid.map((_) => false);
    const hints = emptyGrid.map((_) => 0);

    // Clamp the number of bombs to a valid range. Otherwise generating
    // the bombs will not terminate.
    const safeBoms = Math.max(0, Math.min(bombs, rows * columns - 1));

    // Construct a new game from the initial grids
    return new Game(
      { rows, columns, bombs: safeBoms },
      [],
      {},
      hot,
      hints,
      opened,
      flagged
    );
  }
}

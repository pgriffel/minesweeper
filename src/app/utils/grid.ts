import { Identifiable } from "./relation";


/**
 * A position in a Grid.
 */
export class Position implements Identifiable {

    private constructor(
        public row: number,
        public column: number,
        public id: string
    ) { }

    static from(row: number, column: number): Position {
        return new Position(row, column, `${row}_${column}`);
    }
}


/**
 * Light-weight abstraction around two-dimensinal arrays. Works with the
 * Position class.
 * 
 */
export class Grid<T> {

    constructor(private cells: T[][]) {
        if (cells.length === 0) {
            throw Error("Cannot create a grid with zero rows")
        }
    }

    public rowIndices(): number[] {
        return Array.from(this.cells.keys());
    }

    public columnIndices(): number[] {
        return Array.from(this.cells[0].keys());
    }

    public allPositions(): Position[] {
        const positions = [];
        for (let row of this.rowIndices()) {
            for (let column of this.columnIndices()) {
                positions.push(Position.from(row, column))
            }
        }
        return positions;
    }

    public nrRows(): number {
        return this.cells.length;
    }

    public nrColumns(): number {
        return this.cells[0].length;
    }

    public get(position: Position): T {
        return this.cells[position.row][position.column];
    }

    public set(position: Position, value: T): void {
        this.cells[position.row][position.column] = value;
    }

    public map<U>(fun: (value: T, position: Position) => U): Grid<U> {
        const rows = this.nrRows();
        const columns = this.nrColumns();
        const cells: U[][] = Array(rows);
        for (let row = 0; row < rows; row++) {
            cells[row] = Array(columns);
            for (let column = 0; column < columns; column++) {
                cells[row][column] = fun(this.cells[row][column], Position.from(row, column));
            }
        }
        return new Grid(cells);
    }

    public count(fun: (value: T, position: Position) => boolean): number {
        const rows = this.nrRows();
        const columns = this.nrColumns();
        let count = 0;
        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                if (fun(this.cells[row][column], Position.from(row, column))) {
                    count++;
                }
            }
        }
        return count;
    }

    public neighbours(position: Position): Position[] {
        const neighbours = [];
        for (let di of [-1, 0, 1]) {
            for (let dj of [-1, 0, 1]) {
                if (di != 0 || dj != 0) {
                    const i = position.row + di;
                    const j = position.column + dj;
                    if (i >= 0 && j >= 0 && i < this.nrRows() && j < this.nrColumns()) {
                        neighbours.push(Position.from(i, j))
                    }
                }
            }
        }
        return neighbours;
    }

    static initial(rows: number, columns: number): Grid<unknown> {
        const cells = Array(rows);
        for (let row = 0; row < rows; row++) {
            cells[row] = Array(columns);
        }
        return new Grid(cells)
    }

}
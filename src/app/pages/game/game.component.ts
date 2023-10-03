import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store, select } from '@ngrx/store';
import { filter, interval, map, Observable, of, switchMap, take, takeUntil, tap } from 'rxjs';
import { GameboardComponent } from 'src/app/components/gameboard/gameboard.component';
import { GameStatus, CellInfo } from 'src/app/domain/game';
import { cellFlagged, cellOpened, settingsChanged } from 'src/app/store/game.actions';
import { selectGame } from 'src/app/store/game.selectors';
import { Position } from 'src/app/utils/grid';
import { State as GameState} from '../../store';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  @ViewChild('gameboard')
  gameboard?: GameboardComponent;


  /**
   * Form for the game settings
   */
  form?: FormGroup<{
    rows: FormControl<number>;
    columns: FormControl<number>;
    bombs: FormControl<number>;
  }>;


  /**
   * Data for the game board
   */
  gameData$ = this.createGameDataStream();


  /**
   * The elapsed game time
   */
  timer$ = this.createTimerStream();
  

  constructor(
    private fb: FormBuilder,
    private store: Store<GameState>
  ) {
  }


  /**
   * Angular override. Initialize the form with the current game settings.
   */
  ngOnInit(): void {
    this.store.select(selectGame).pipe(take(1)).subscribe(game => {
      this.form = this.fb.nonNullable.group({
        rows: [game.settings.rows, [Validators.required, Validators.min(1)]],
        columns: [game.settings.columns, [Validators.required, Validators.min(1)]],
        bombs: [game.settings.bombs, Validators.required]
      })
    });
  }


  public onOpenCell(event: { row: number, column: number }) {
    this.store.dispatch(cellOpened({position: Position.from(event.row, event.column)}));
  }


  public onFlagCell(event: { row: number, column: number }) {
    this.store.dispatch(cellFlagged({position: Position.from(event.row, event.column)}));
  }


  public onSubmit() {
    if (this.form) {
      this.store.dispatch(settingsChanged(this.form.getRawValue()));
    }
  }


  /**
   * Takes a snapshot of the current game state
   */
  private createGameDataStream(): Observable<{
      status: GameStatus;
      bombs: number;
      toOpen: number;
      cells: CellInfo[][];
    }> {
    return this.store.pipe(select(selectGame)).pipe(
      tap(game => {
        if (game.status() === 'lost' && this.gameboard) {
          this.gameboard.playExplosion();
        }
      }),
      map(game => {
        return {
          status: game.status(),
          bombs: game.settings.bombs,
          toOpen: game.stillToOpen(),
          cells: game.rowIndices().map(row => {
            return game.columnIndices().map(column => {
              return game.cellInfo(Position.from(row, column))
            })
          })
        };
      })
    );
  }


  /**
   * Emits the elapsed game time. Emits every 100 ms when the game is running.
   */
  private createTimerStream(): Observable<number> {
    const game$ = this.store.pipe(select(selectGame));
    return game$.pipe(
      switchMap(game => {
        if (game.status() === 'running') {
          return interval(100).pipe(
            map(_ => game.gameTime()),
            takeUntil(game$.pipe(filter(game => game.status() !== 'running')))
          )
        } else {
          return of(game.gameTime());
        }
      })
    )
  }

}

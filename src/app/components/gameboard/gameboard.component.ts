import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CellInfo } from 'src/app/domain/game';;


/**
 * Displays a minesweeper gameboard. Input is a two-dimensional array of CellInfo. Emits
 * output when the user clicks a cell on the gameboard.
 * 
 * Can also display an explosion at the last clicked position.
 */
@Component({
  selector: 'app-gameboard',
  templateUrl: './gameboard.component.html',
  styleUrls: ['./gameboard.component.scss']
})
export class GameboardComponent implements AfterViewInit {

  /**
   * Data for the game to display.
   */
  @Input()
  data?: CellInfo[][];


  /**
   * The video element to play the explosion
   */
  @ViewChild('vid')
  vid?: ElementRef;


  /**
   * The audio element to play the explosion
   */
  @ViewChild('audio')
  audio?: ElementRef;


  /**
  * Emitted when a player opens a cell on the game board
  */
  @Output()
  open = new EventEmitter<{ row: number, column: number }>();


  /**
   * Emitted when a player flags a cell on the game board
   */
  @Output()
  flag = new EventEmitter<{ row: number, column: number }>();


  /**
   * Toggle that is set when the explosion video is displayed. See playExplosion below.
   */
  public showingVideo: boolean = false;


  /**
   * CSS classes for the opened cells. See method cellClass.
   */
  private readonly classNames = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];


  /**
   * Handler for clicking a button in the button grid. A regular click is an open. A click
   * with shift pressed is a flag.
   */
  public clickCell(event: any, row: number, column: number) {

    // Call the right emitter
    if (event.shiftKey) {
      this.flag.emit({ row, column });
    } else {
      this.open.emit({ row, column });
    }

    // Move the explosion video to the position of the mouse click just
    // in case it is the fatal click.
    if (this.vid) {
      this.vid.nativeElement.style.left = event.pageX - 100 + 'px';
      this.vid.nativeElement.style.top = event.pageY - 180 + 'px';
    }
  }


  /**
    * Angular override. Initialize the video player. 
    */
  ngAfterViewInit(): void {
    if (this.vid) {
      this.vid.nativeElement.addEventListener('ended', () => {
        this.showingVideo = false;
      });
    }
  }


  /**
   * CSS class for the buttons in the button grid.
   * 
   * A cell can be closed or open and can be flagged or not. A closed cell has class 'closed'. 
   * A flagged cell has class 'flagged'. An open cells has class 'open'. If it is not flagged
   * it additionally has clas 'bomb', or one of the classes 'zero' to 'eight', depending on the 
   * cell's hint value. 
   */
  public cellClass(info: CellInfo): string {
    if (info.opened) {
      return 'open ' + (info.flagged ? 'flagged' : (info.hot ? 'bomb' : this.classNames[info.hint]));
    }
    if (info.flagged) {
      return 'flagged closed';
    }
    return 'closed';
  }


  /**
   * Play a video of an explosion. The video element was already moved to the position
   * of the fatal click.
   */
  public playExplosion() {
    if (this.audio) {
      this.audio.nativeElement.play();
    }
    setTimeout(() => {
      if (this.vid) {
        this.showingVideo = true;
        this.vid.nativeElement.play();
      }
    }, 100)
  }
}

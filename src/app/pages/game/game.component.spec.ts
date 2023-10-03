import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GameboardComponent } from 'src/app/components/gameboard/gameboard.component';
import { provideMockStore } from '@ngrx/store/testing'
import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  const initialState = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameComponent, GameboardComponent],
      imports: [ReactiveFormsModule],
      providers: [
        provideMockStore({ initialState })
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Menu } from './menu/menu';
import { Hero } from './hero/hero';
import { Footer } from './footer/footer';



@Component({
  selector: 'pb-root',
  imports: [RouterOutlet, Menu, Hero, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})


export class App {
  protected readonly title = signal('personal-budget');
}

import { Component } from '@angular/core';
import { RouterLink} from '@angular/router';

@Component({
  selector: 'pb-menu',
  imports: [RouterLink ],
  standalone: true,
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class Menu {

}

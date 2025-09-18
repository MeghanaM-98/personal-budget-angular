import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Homepage } from './homepage/homepage';
import { About } from './about/about';
import { P404 } from './p404/p404';
import { Contact } from './contact/contact';


export const routes: Routes = [
  {
    path: '',
    component: Homepage,
    pathMatch:'full'
  },
  {
    path: 'about',
    component: About
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'contact',
    component: Contact
  },
  {
    path: '**',
    component: P404
  }


];

import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './login/home.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent,
    children: [
      // Add child routes for Profile, Loan Details etc. here
      // { path: 'profile', component: ProfileComponent },
      // { path: 'loan-details', component: LoanDetailsComponent },
    ] },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default route
  { path: '**', redirectTo: '/login' }, // Wildcard route for 404 or unknown paths
];
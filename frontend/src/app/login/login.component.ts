import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Import Router
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule], // <-- HttpClientModule is needed for the provider
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  credentials = { username: '', password: '' };
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { } // Inject Router

  ngOnInit(): void {
  }

  login(): void {
    this.authService.login(this.credentials).subscribe(
      () => { // Changed response to () as it's not used directly here
        this.errorMessage = '';
        console.log('Login successful');
        this.router.navigate(['/home']); // Navigate to home page on successful login
      },
      error => {
        console.error('Login failed', error);
        this.errorMessage = 'Login failed. Please check your credentials.';
      }
    );
  }
}

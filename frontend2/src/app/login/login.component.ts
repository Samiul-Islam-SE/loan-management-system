import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
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

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  }

  login(): void {
    this.authService.login(this.credentials).subscribe(
      response => {
        console.log('Login successful', response);
        this.errorMessage = '';
      },
      error => {
        console.error('Login failed', error);
        this.errorMessage = 'Login failed. Please check your credentials.';
      }
    );
  }
}

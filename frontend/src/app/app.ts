import { Component, signal } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LoginComponent, HttpClientModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}

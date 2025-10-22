import { Component, signal } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule

@Component({
  selector: 'app-root',
  standalone: true,
  // By importing HttpClientModule here, its providers (like HttpClient) become available to this component
  imports: [LoginComponent, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}

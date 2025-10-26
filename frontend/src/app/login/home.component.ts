import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../auth.service'; 
import { Loan } from '../model/loan.model';
import { UserProfile } from '../model/user-profile.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, MatTableModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: UserProfile | null = null;
  
  // Define the columns that will be displayed in the table
  displayedColumns: string[] = ['id', 'title', 'principalCents', 'promisedDueDate', 'status'];
  
  // The data source for the Material table
  dataSource = new MatTableDataSource<Loan>();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    const loans = this.authService.getCurrentLoans();
    if (loans) {
      this.dataSource.data = loans;
    }
  }

  logout(): void {
    this.authService.logout();
    console.log('User logged out');
    this.router.navigate(['/login']);
  }
}
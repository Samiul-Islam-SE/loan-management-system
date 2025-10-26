import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Loan, LoginCredentials, LoginResponse, UserProfile } from './model';
import { environment } from './environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly LOANS_KEY = 'auth_loans';

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/users/login`, credentials)
      .pipe(
        tap((response) => {
          if (response) {
            this.storeAuthData( response.user, response.loans);
          }
        })
      );
  }

  logout(): void {
    // Clear token and user info from local storage
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.LOANS_KEY);
  }

  private storeAuthData( user?: UserProfile, loans?: Loan[]): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.LOANS_KEY, JSON.stringify(loans));
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): UserProfile | null { // Retrieves user from storage
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  getCurrentLoans(): Loan[] | null {
    const loansJson = localStorage.getItem(this.LOANS_KEY);
    return loansJson ? JSON.parse(loansJson) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

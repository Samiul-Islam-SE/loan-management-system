import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
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
    // We need to observe the full response to get headers
    return this.http.post<LoginResponse>(`${this.apiUrl}/users/login`, credentials, { observe: 'response' }).pipe(
      tap((response) => {
        const token = response.headers.get('Authorization');
        const body = response.body;
        if (token && body) {
          this.storeAuthData(token, body.user, body.loans);
        }
      }),
      // Map the full HttpResponse back to just its body for the component subscriber
      map((response: HttpResponse<LoginResponse>) => response.body as LoginResponse)
    );
  }

  logout(): void {
    // Clear token and user info from local storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.LOANS_KEY);
  }

  private storeAuthData(token: string, user?: UserProfile, loans?: Loan[]): void {
    localStorage.setItem(this.TOKEN_KEY, token);
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

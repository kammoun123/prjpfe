import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, Utilisateur } from '../models/utilisateur.model';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject, Injectable } from '@angular/core';

export interface Profil extends Utilisateur {
    id?: string;
    departement?: string;
    dateAdhesion?: string;
    notificationsEmail?: boolean;
    modeSombre?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private platformId = inject(PLATFORM_ID);
  private currentUserSubject = new BehaviorSubject<Utilisateur | null>(this.getUserFromStorage());

  constructor(private http: HttpClient) { }

  register(user: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.apiUrl}/register`, user);
  }

  login(credentials: { email: string, motDePasse: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  updateSession(user: Utilisateur) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): Utilisateur | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserObservable(): Observable<Utilisateur | null> {
    return this.currentUserSubject.asObservable();
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private getUserFromStorage(): Utilisateur | null {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // User Management for Admin
  getUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${environment.apiUrl}/users`);
  }

  updateUserStatus(id: number, status: string): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${environment.apiUrl}/users/${id}/status`, { status });
  }

  updateUser(id: number, user: Utilisateur): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${environment.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/${id}`);
  }

  // Profile methods
  getProfil(id: string): Observable<Profil> {
    return this.http.get<Profil>(`${environment.apiUrl}/users/${id}`);
  }

  updateProfil(id: string, profil: Partial<Profil>): Observable<Profil> {
    return this.http.put<Profil>(`${environment.apiUrl}/users/${id}`, profil);
  }
}

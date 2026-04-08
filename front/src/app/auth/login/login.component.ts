import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = { email: '', motDePasse: '' };
  error = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.redirectBasedOnRole(user.role);
      }
    }
  }

  login() {
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        const role = response.user.role;
        this.redirectBasedOnRole(role);
      },
      error: (err) => {
        if (err.status === 401) {
          this.error = 'Email ou mot de passe incorrect';
        } else if (err.status === 403) {
          this.error = 'Votre compte n\'a pas encore été accepté par l\'administrateur.';
        } else {
          this.error = 'Erreur de connexion.';
        }
      }
    });
  }

  private redirectBasedOnRole(role: string | undefined) {
    if (!role) {
      this.router.navigate(['/']);
      return;
    }

    const normalizedRole = role.toUpperCase().trim();
    switch (normalizedRole) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'TECHNICIEN':
        this.router.navigate(['/technicien']);
        break;
      case 'CONTROLEUR':
        this.router.navigate(['/controleur']);
        break;
      case 'MAGASINIER':
        this.router.navigate(['/magasinier']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}

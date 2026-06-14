import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  loading: boolean = false;
  message: string = '';
  isError: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.email) return;

    this.loading = true;
    this.message = '';
    
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.message = "Si un compte est associé à cette adresse, vous recevrez un lien de réinitialisation sous peu.";
        this.isError = false;
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 403) {
          this.message = err.error?.message || "Votre compte n'est pas encore activé. Veuillez contacter l'administrateur.";
        } else {
          this.message = "Une erreur est survenue lors de l'envoi de l'email.";
        }
        this.isError = true;
        this.loading = false;
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

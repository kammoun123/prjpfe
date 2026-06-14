import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  message: string = '';
  isError: boolean = false;
  isSuccess: boolean = false;
  showPassword: boolean = false;
  showConfirm: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.message = 'Lien invalide ou expiré. Veuillez refaire une demande.';
      this.isError = true;
    }
  }

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword;
  }

  onSubmit() {
    if (!this.passwordsMatch || !this.newPassword || !this.token) return;

    this.loading = true;
    this.message = '';

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.isSuccess = true;
        this.isError = false;
        this.message = 'Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.message = err.error || 'Le lien est invalide ou a expiré. Veuillez refaire une demande.';
        this.isError = true;
        this.isSuccess = false;
        this.loading = false;
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

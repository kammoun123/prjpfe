import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { Utilisateur } from '../../models/utilisateur.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user: Utilisateur = {
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    role: 'TECHNICIEN',
    statut: 'PENDING'
  };
  error = '';
  success = '';

  roles = ['TECHNICIEN', 'CONTROLEUR', 'MAGASINIER'];


  constructor(private authService: AuthService, private router: Router) { }

  register() {
    this.authService.register(this.user).subscribe({
      next: () => {
        this.success = 'Compte créé avec succès ! Votre compte est en attente de validation par l\'administrateur.';
        this.error = '';
        this.user = { nom: '', prenom: '', email: '', motDePasse: '', role: 'TECHNICIEN', statut: 'PENDING' };
      },
      error: (err) => {
        this.success = '';
        this.error = err.error?.message || err.error || 'Erreur lors de l’inscription. Veuillez réessayer.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

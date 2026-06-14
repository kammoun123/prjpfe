import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../Services/auth.service';
import { Utilisateur } from '../../models/utilisateur.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: Utilisateur[] = [];
  searchTerm: string = '';
  error = '';
  success = '';

  get filteredUsers() {
    if (!this.searchTerm) return this.users;
    const search = this.searchTerm.toLowerCase();
    return this.users.filter(user => 
      user.nom.toLowerCase().includes(search) || 
      user.prenom.toLowerCase().includes(search) || 
      user.email.toLowerCase().includes(search)
    );
  }

  // Modal edit
  showEditModal = false;
  editingUser: Utilisateur & { newPassword?: string } = {
    nom: '', prenom: '', email: '', role: '', statut: '', newPassword: ''
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get stats() {
    return {
      total: this.users.length,
      active: this.users.filter(u => u.statut === 'ACTIVE').length,
      admins: this.users.filter(u => u.role === 'ADMIN').length,
      techniciens: this.users.filter(u => u.role === 'TECHNICIEN').length,
      controleurs: this.users.filter(u => u.role === 'CONTROLEUR').length,
      lastUpdate: new Date().toLocaleDateString()
    };
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (data) => { this.users = data; this.error = ''; },
      error: (err) => {
        console.error('Error loading users', err);
        this.error = `Erreur (${err.status}): ${err.message || 'Serveur inaccessible'}`;
      }
    });
  }

  openEdit(user: Utilisateur): void {
    this.editingUser = { ...user, newPassword: '' };
    this.showEditModal = true;
    this.error = '';
    this.success = '';
  }

  cancelEdit(): void {
    this.showEditModal = false;
  }

  saveEdit(): void {
    const payload: Utilisateur = {
      ...this.editingUser,
      motDePasse: this.editingUser.newPassword || undefined
    };
    delete (payload as any).newPassword;

    this.authService.updateUser(this.editingUser.idUtilisateur!, payload).subscribe({
      next: () => {
        this.success = 'Utilisateur modifié avec succès !';
        this.showEditModal = false;
        this.loadUsers();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Erreur lors de la modification';
        console.error(err);
      }
    });
  }

  updateStatus(id: number, status: string): void {
    this.authService.updateUserStatus(id, status).subscribe({
      next: () => {
        this.success = `Statut mis à jour : ${status}`;
        this.loadUsers();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => this.error = 'Erreur lors de la mise à jour du statut'
    });
  }

  deleteUser(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.authService.deleteUser(id).subscribe({
        next: () => {
          this.success = 'Utilisateur supprimé avec succès';
          this.loadUsers();
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => this.error = 'Erreur lors de la suppression'
      });
    }
  }
}

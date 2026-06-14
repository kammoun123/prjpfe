import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurService } from '../../Services/fournisseur.service';
import { Fournisseur } from '../../models/fournisseur.model';

@Component({
  selector: 'app-fournisseur-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fournisseur-management.component.html',
  styleUrl: './fournisseur-management.component.css'
})
export class FournisseurManagementComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  searchTerm: string = '';
  showForm: boolean = false;
  formMode: 'add' | 'edit' = 'add';
  loading: boolean = false;
  success: string = '';
  error: string = '';
  stats = { total: 0, active: 0, inactive: 0 };

  currentFournisseur: Fournisseur = this.getEmptyFournisseur();

  constructor(private fournisseurService: FournisseurService) {}

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  loadFournisseurs(): void {
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
        this.updateStats();
      },
      error: (err) => this.error = "Erreur de chargement des fournisseurs"
    });
  }

  updateStats(): void {
    this.stats.total = this.fournisseurs.length;
    this.stats.active = this.fournisseurs.filter(f => f.statut === 'ACTIF').length;
    this.stats.inactive = this.fournisseurs.filter(f => f.statut === 'INACTIF').length;
  }

  getEmptyFournisseur(): Fournisseur {
    return {
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      statut: 'ACTIF'
    };
  }

  openAddForm(): void {
    this.formMode = 'add';
    this.currentFournisseur = this.getEmptyFournisseur();
    this.showForm = true;
  }

  openEditForm(f: Fournisseur): void {
    this.formMode = 'edit';
    this.currentFournisseur = { ...f };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.success = '';
    this.error = '';
  }

  saveFournisseur(): void {
    this.loading = true;
    const obs = this.formMode === 'add' 
      ? this.fournisseurService.createFournisseur(this.currentFournisseur)
      : this.fournisseurService.updateFournisseur(this.currentFournisseur.idFournisseur!, this.currentFournisseur);

    obs.subscribe({
      next: () => {
        this.success = `Fournisseur ${this.formMode === 'add' ? 'ajouté' : 'modifié'} avec succès`;
        this.loadFournisseurs();
        setTimeout(() => this.closeForm(), 1500);
      },
      error: () => {
        this.error = "Erreur lors de l'enregistrement";
        this.loading = false;
      }
    });
  }

  deleteFournisseur(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      this.fournisseurService.deleteFournisseur(id).subscribe({
        next: () => {
          this.success = "Fournisseur supprimé";
          this.loadFournisseurs();
        },
        error: () => this.error = "Erreur lors de la suppression"
      });
    }
  }

  toggleStatut(f: Fournisseur): void {
    const newStatut = f.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    const updated = { ...f, statut: newStatut };
    this.fournisseurService.updateFournisseur(f.idFournisseur!, updated).subscribe({
      next: () => this.loadFournisseurs(),
      error: () => this.error = "Erreur lors du changement de statut"
    });
  }

  get filteredFournisseurs(): Fournisseur[] {
    return this.fournisseurs.filter(f => 
      f.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}

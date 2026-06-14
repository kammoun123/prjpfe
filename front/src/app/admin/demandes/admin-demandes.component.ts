import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeProduitService } from '../../Services/demande-produit.service';
import { NotificationService } from '../../Services/notification.service';
import { ToastService } from '../../Services/toast.service';
import { DemandeProduit } from '../../models/demande-produit.model';
import { FournisseurService } from '../../Services/fournisseur.service';
import { Fournisseur } from '../../models/fournisseur.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-demandes.component.html',
  styleUrl: './admin-demandes.component.css'
})
export class AdminDemandesComponent implements OnInit {
  private demandeService = inject(DemandeProduitService);
  private notificationService = inject(NotificationService);
  private toastService = inject(ToastService);
  private fournisseurService = inject(FournisseurService);

  demandes = signal<DemandeProduit[]>([]);
  activeTab: 'pending' | 'history' = 'pending';

  fournisseurs = signal<Fournisseur[]>([]);
  showOrderModal = signal(false);
  selectedDemandeForOrder = signal<DemandeProduit | null>(null);
  selectedFournisseurId = signal<number | null>(null);
  selectedDateLivraison = signal<string>('');
  orderLoading = signal(false);

  pendingCount = computed(() => {
    return this.demandes().filter(d => {
      const s = (d.statut || '').toUpperCase().trim();
      return s !== 'VALIDATED' && s !== 'REFUSED' && s !== 'REFUSÉ';
    }).length;
  });

  validatedCount = computed(() =>
    this.demandes().filter(d => (d.statut || '').toUpperCase() === 'VALIDATED').length
  );

  ngOnInit() {
    this.loadDemandes();
    this.loadFournisseurs();
  }

  loadFournisseurs() {
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => {
        // Garder uniquement les fournisseurs actifs
        this.fournisseurs.set(data.filter(f => f.statut === 'ACTIF'));
      },
      error: (err) => console.error('Erreur chargement fournisseurs', err)
    });
  }

  loadDemandes() {
    this.demandeService.getDemandes().subscribe({
      next: (data) => {
        // Sort by newest first
        this.demandes.set(data.reverse());
      },
      error: (err) => {
        console.error('Erreur chargement demandes', err);
        this.toastService.show('Erreur de chargement des demandes', 'error');
      }
    });
  }

  filteredDemandes() {
    const list = this.demandes();
    if (this.activeTab === 'pending') {
      return list.filter(d => {
        const s = (d.statut || '').toUpperCase().trim();
        return s !== 'VALIDATED' && s !== 'REFUSED' && s !== 'REFUSÉ';
      });
    } else {
      return list.filter(d => {
        const s = (d.statut || '').toUpperCase().trim();
        return s === 'VALIDATED' || s === 'REFUSED' || s === 'REFUSÉ';
      });
    }
  }

  updateStatus(demande: DemandeProduit, newStatut: string) {
    if (!demande.id) return;

    this.demandeService.updateStatutDemande(demande.id, newStatut).subscribe({
      next: () => {
        this.toastService.show(`Demande ${newStatut === 'VALIDATED' ? 'approuvée' : 'refusée'} avec succès`, 'success');

        // Notification back to the Magasinier (Technician in models)
        if (demande.technicienId) {
          this.notificationService.createNotification({
            message: `Votre demande pour ${demande.produit?.designation || 'produit'} a été ${newStatut === 'VALIDATED' ? 'APPROUVÉE' : 'REFUSÉE'} par l'Administrateur.`,
            typeNotification: newStatut === 'VALIDATED' ? 'SUCCESS' : 'ALERT',
            roleCible: 'MAGASINIER',
            dateCreation: new Date().toISOString(),
            statut: 'NON_LUE'
          }).subscribe();
        }

        this.loadDemandes();
      },
      error: (err) => {
        console.error('Erreur MAJ statut', err);
        this.toastService.show('Erreur lors de la mise à jour', 'error');
      }
    });
  }

  getInitial(user: any): string {
    if (user && user.prenom) return user.prenom.charAt(0).toUpperCase();
    return 'M';
  }

  getStatusClass(statut: string | undefined): string {
    if (!statut) return 'EN_ATTENTE';
    const s = statut.toUpperCase().trim();
    if (s === 'VALIDATED' || s === 'VALIDÉ' || s === 'VALIDÉE') return 'VALIDATED';
    if (s === 'REFUSED' || s === 'REFUSÉ') return 'REFUSED';
    return 'EN_ATTENTE';
  }

  formatStatut(statut: string | undefined): string {
    if (!statut) return 'En attente';
    const s = statut.toUpperCase().trim();
    if (s === 'VALIDATED' || s === 'VALIDÉ' || s === 'VALIDÉE' || s === 'VALIDE') return 'VALIDE';
    if (s === 'REFUSED' || s === 'REFUSÉ' || s === 'REFUSE') return 'REFUSÉ';
    if (s === 'TRANSFÉRÉ_ADMIN' || s.includes('ADMIN')) return 'En attente Admin';
    return statut;
  }

  // --- ORDER MODAL LOGIC ---
  openOrderModal(demande: DemandeProduit) {
    this.selectedDemandeForOrder.set(demande);
    this.selectedFournisseurId.set(null);
    this.selectedDateLivraison.set('');
    this.showOrderModal.set(true);
  }

  closeOrderModal() {
    this.showOrderModal.set(false);
    this.selectedDemandeForOrder.set(null);
    this.selectedFournisseurId.set(null);
    this.selectedDateLivraison.set('');
    this.orderLoading.set(false);
  }

  submitOrder() {
    const demande = this.selectedDemandeForOrder();
    const fournisseurId = this.selectedFournisseurId();
    const dateLivraison = this.selectedDateLivraison();

    if (!demande || !demande.id || !fournisseurId) {
      this.toastService.show('Veuillez sélectionner un fournisseur.', 'warning');
      return;
    }

    this.orderLoading.set(true);
    this.demandeService.orderFromSupplier(demande.id, fournisseurId, dateLivraison).subscribe({
      next: () => {
        this.toastService.show('Commande envoyée au fournisseur avec succès', 'success');
        
        // Notify the requester
        if (demande.technicienId) {
          this.notificationService.createNotification({
            message: `Votre demande pour ${demande.produit?.designation} a été commandée chez un fournisseur externe.`,
            typeNotification: 'INFO',
            roleCible: 'MAGASINIER',
            dateCreation: new Date().toISOString(),
            statut: 'NON_LUE'
          }).subscribe();
        }

        this.loadDemandes();
        this.closeOrderModal();
      },
      error: (err) => {
        console.error('Erreur commande fournisseur', err);
        this.toastService.show('Erreur lors de l\'envoi de la commande', 'error');
        this.orderLoading.set(false);
      }
    });
  }
}

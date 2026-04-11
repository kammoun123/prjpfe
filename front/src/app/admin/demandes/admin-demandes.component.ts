import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeProduitService } from '../../Services/demande-produit.service';
import { NotificationService } from '../../Services/notification.service';
import { ToastService } from '../../Services/toast.service';
import { DemandeProduit } from '../../models/demande-produit.model';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-demandes.component.html',
  styleUrl: './admin-demandes.component.css'
})
export class AdminDemandesComponent implements OnInit {
  private demandeService = inject(DemandeProduitService);
  private notificationService = inject(NotificationService);
  private toastService = inject(ToastService);

  demandes = signal<DemandeProduit[]>([]);
  activeTab: 'pending' | 'history' = 'pending';

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
}

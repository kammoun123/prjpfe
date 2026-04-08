import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeProduitService } from '../../Services/demande-produit.service';
import { PieceService } from '../../Services/piece.service';
import { NotificationService } from '../../Services/notification.service';
import { ToastService } from '../../Services/toast.service';
import { DemandeProduit } from '../../models/demande-produit.model';
import { Produit } from '../../models/produit.model';

@Component({
  selector: 'app-demandes-consultation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demandes-consultation.component.html',
  styleUrl: './demandes-consultation.component.css'
})
export class DemandesConsultationComponent implements OnInit {
  private demandeService = inject(DemandeProduitService);
  private pieceService = inject(PieceService);
  private notifService = inject(NotificationService);
  private toastService = inject(ToastService);
  
  demandes = signal<DemandeProduit[]>([]);
  pieces = signal<Produit[]>([]);
  activeTab = signal<'attente' | 'historique'>('attente');

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.demandeService.getDemandes().subscribe(data => this.demandes.set(data));
    this.pieceService.getPieces().subscribe(data => this.pieces.set(data));
  }

  setTab(tab: 'attente' | 'historique') {
    this.activeTab.set(tab);
  }

  filteredDemandes() {
    if (this.activeTab() === 'attente') {
      return this.demandes().filter(d => d.statut === 'EN_ATTENTE' || d.statut === 'PENDING' || d.statut === 'En attente' || d.statut === 'EN ATTENTE');
    } else {
      return this.demandes().filter(d => d.statut !== 'EN_ATTENTE' && d.statut !== 'PENDING' && d.statut !== 'En attente' && d.statut !== 'EN ATTENTE');
    }
  }

  getPieceName(id: number | undefined): string {
    if (!id) return '';
    const piece = this.pieces().find(p => p.idProduit === id);
    return piece ? piece.designation : '';
  }

  getStatusClass(statut: string) {
    if (!statut) return 's-commande';
    const s = statut.toUpperCase();
    if (s.includes('VALID') || s.includes('APPROV')) return 's-validated';
    if (s.includes('REFUS') || s.includes('ANNUL') || s.includes('REJET')) return 's-rejected';
    return 's-commande';
  }

  getStatusIcon(statut: string) {
    if (!statut) return 'bi bi-cart-fill';
    const s = statut.toUpperCase();
    if (s.includes('VALID') || s.includes('APPROV')) return 'bi bi-check-circle-fill';
    if (s.includes('REFUS') || s.includes('ANNUL') || s.includes('REJET')) return 'bi bi-x-circle-fill';
    return 'bi bi-cart-fill';
  }

  formatStatut(statut: string): string {
    if (!statut) return 'En commande';
    const upper = statut.toUpperCase();
    if (upper === 'TRANSFÉRÉ_ADMIN' || upper.includes('ADMIN') || upper.includes('COMMANDE') || upper.includes('TRANSFÉRÉ')) return 'En commande';
    if (upper.includes('VALID') || upper.includes('APPROV')) return 'Validée';
    if (upper.includes('REFUS') || upper.includes('REJET')) return 'Rejetée';
    return statut;
  }

  validerDemande(demande: any, statut: string) {
    const id = demande.idDemande || demande.id;
    this.demandeService.updateStatutDemande(id, statut).subscribe({
      next: () => {
        // Envoi d'une notification à la suite du changement de statut
        let role = 'TECHNICIEN';
        let msg = `Votre demande pour la pièce a été ${statut}.`;
        let type = 'info';

        if (statut === 'VALIDATED') {
           msg = 'Votre demande de pièce a été validée par le Magasinier.';
           type = 'success';
        } else if (statut === 'Refusé') {
           msg = 'Votre demande de pièce a été rejetée.';
           type = 'alerte';
        } else if (statut === 'En Commande' || statut === 'TRANSFÉRÉ_ADMIN') {
           role = 'ADMIN'; 
           msg = `Le Magasinier a transféré une demande pour : ${this.getPieceName(demande.idProduit)}.`;
           type = 'warning';
        }

        this.notifService.createNotification({
           produitId: demande.produitId || demande.idProduit || null,
           message: msg,
           typeNotification: type,
           dateCreation: new Date().toISOString(),
           statut: 'NON_LUE',
           roleCible: role
        }).subscribe();

        // Afficher également un Toast de réussite locale
        if (statut === 'VALIDATED') {
            this.toastService.show('Demande validée avec succès !', 'success');
        } else if (statut === 'Refusé') {
            this.toastService.show('Demande rejetée.', 'error');
        } else if (statut === 'En Commande') {
            this.toastService.show('Demande transférée au service des achats.', 'info');
        }

        this.loadData();
      },
      error: (err) => {
         console.error('Erreur lors de la mise à jour du statut', err);
         this.toastService.show('Une erreur est survenue.', 'error');
      }
    });
  }

  transfererAdmin(demande: any) {
    // Statut explicite pour l'Admin
    this.validerDemande(demande, 'TRANSFÉRÉ_ADMIN');
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeProduitService } from '../../Services/demande-produit.service';
import { PieceService } from '../../Services/piece.service';
import { NotificationService } from '../../Services/notification.service';
import { ToastService } from '../../Services/toast.service';
import { FormsModule } from '@angular/forms';
import { Produit } from '../../models/produit.model';
import { DemandeProduit } from '../../models/demande-produit.model';

// Interface pour les lignes groupées (une ligne par demande)
interface DemandeRow {
  demande: DemandeProduit;
  pieces: { name: string; quantite: number; observation?: string }[];
  searchString: string;
  totalQuantite: number;
  motif: string;
}

@Component({
  selector: 'app-demandes-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Filtering signals
  startDate = signal<string>('');
  endDate = signal<string>('');
  searchTerm = signal<string>('');

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.demandeService.getDemandes().subscribe(data => {
      this.demandes.set(data);
    });
    this.pieceService.getPieces().subscribe(data => this.pieces.set(data));
  }

  setTab(tab: 'attente' | 'historique') {
    this.activeTab.set(tab);
  }

  filteredDemandes() {
    // Créer un tableau groupé : une ligne par demande
    const groupedRows: DemandeRow[] = [];

    this.demandes().forEach(d => {
      const pieces: { name: string; quantite: number; observation?: string }[] = [];
      let searchArr: string[] = [];
      let totalQty = 0;
      let motifs: string[] = [];

      if (!d.lignes || d.lignes.length === 0) {
        pieces.push({ name: '-', quantite: 0 });
      } else {
        d.lignes.forEach(ligne => {
          let pieceName = 'Pièce Inconnue';

          if (ligne.produit && ligne.produit.designation) {
            pieceName = ligne.produit.designation;
          } else if (ligne.produitId) {
            const piece = this.pieces().find(p => p.idProduit === ligne.produitId);
            if (piece && piece.designation) {
              pieceName = piece.designation;
            } else {
              pieceName = `Pièce #${ligne.produitId}`;
            }
          }

          pieces.push({ name: pieceName, quantite: ligne.quantite || 0, observation: ligne.observation });
          searchArr.push(pieceName.toLowerCase());
          totalQty += (ligne.quantite || 0);
          if (ligne.motif && ligne.motif.trim() !== '') {
            motifs.push(ligne.motif);
          }
        });
      }

      groupedRows.push({
        demande: d,
        pieces: pieces,
        searchString: searchArr.join(' '),
        totalQuantite: totalQty,
        motif: motifs.length > 0 ? motifs.join(' | ') : (d.observation || 'Aucun motif')
      });
    });

    // Appliquer les filtres
    let filtered = groupedRows;

    // 1. Tab Filter (Status)
    if (this.activeTab() === 'attente') {
      filtered = filtered.filter(row =>
        ['EN_ATTENTE', 'PENDING', 'En attente', 'EN ATTENTE'].includes(row.demande.statut?.toUpperCase() || '')
      );
    } else {
      filtered = filtered.filter(row =>
        !['EN_ATTENTE', 'PENDING', 'En attente', 'EN ATTENTE'].includes(row.demande.statut?.toUpperCase() || '')
      );
    }

    // 2. Date Filter
    if (this.startDate()) {
      filtered = filtered.filter(row => row.demande.dateDemande && new Date(row.demande.dateDemande).toISOString().split('T')[0] >= this.startDate());
    }
    if (this.endDate()) {
      filtered = filtered.filter(row => row.demande.dateDemande && new Date(row.demande.dateDemande).toISOString().split('T')[0] <= this.endDate());
    }

    // 3. Search Filter
    if (this.searchTerm()) {
      const search = this.searchTerm().toLowerCase();
      filtered = filtered.filter(row => row.searchString.includes(search));
    }

    // Always sort filtered list by date descending (Newest First)
    return filtered.sort((a, b) => {
      const dateA = a.demande.dateDemande ? new Date(a.demande.dateDemande).getTime() : 0;
      const dateB = b.demande.dateDemande ? new Date(b.demande.dateDemande).getTime() : 0;
      return dateB - dateA;
    });
  }

  getPieceName(id: number | undefined): string {
    if (!id) return '';
    const piece = this.pieces().find(p => p.idProduit === id);
    return piece ? piece.designation : '';
  }

  getDemandePiecesInfo(demande: DemandeProduit): string {
    if (!demande.lignes || demande.lignes.length === 0) return 'Aucune pièce';
    return demande.lignes.map((l: any) => this.getPieceName(l.produitId) || 'Pièce #' + l.produitId).join(', ');
  }

  getDemandeTotalQuantite(demande: DemandeProduit): number {
    if (!demande.lignes || demande.lignes.length === 0) return 0;
    return demande.lignes.reduce((sum: number, ligne: any) => sum + (ligne.quantite || 0), 0);
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
    if (upper.includes('VALID') || upper.includes('APPROV')) return 'VALIDE';
    if (upper.includes('REFUS') || upper.includes('REJET')) return 'Rejetée';
    return statut;
  }

  validerDemande(demande: any, statut: string) {
    const id = demande.idDemande || demande.id;
    this.demandeService.updateStatutDemande(id, statut).subscribe({
      next: () => {
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
          msg = `Le Magasinier a transféré une demande pour : ${this.getDemandePiecesInfo(demande)}.`;
          type = 'warning';
        }

        this.notifService.createNotification({
          produitId: demande.lignes && demande.lignes.length > 0 ? demande.lignes[0].produitId : null,
          message: msg,
          typeNotification: type,
          dateCreation: new Date().toISOString(),
          statut: 'NON_LUE',
          roleCible: role
        }).subscribe();

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
    this.validerDemande(demande, 'TRANSFÉRÉ_ADMIN');
  }
}

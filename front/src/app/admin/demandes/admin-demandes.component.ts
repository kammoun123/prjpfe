import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeProduitService } from '../../Services/demande-produit.service';
import { NotificationService } from '../../Services/notification.service';
import { ToastService } from '../../Services/toast.service';
import { DemandeProduit } from '../../models/demande-produit.model';
import { FournisseurService } from '../../Services/fournisseur.service';
import { Fournisseur } from '../../models/fournisseur.model';
import { Commande } from '../../models/commande.model';
import { Produit } from '../../models/produit.model';
import { PieceService } from '../../Services/piece.service';
import { FormsModule } from '@angular/forms';
import { CommandeFournisseurService } from '../../Services/commande-fournisseur.service';

// Interface pour les lignes flattened (une ligne par pièce)
interface DemandeLigneRow {
  demande: DemandeProduit;
  pieceName: string;
  quantite: number;
  produitId: number | undefined;
}

interface CommandeLigneRow {
  commande: Commande;
  pieceName: string;
  quantite: number;
  produitId: number | undefined;
}

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
  private pieceService = inject(PieceService);
  private commandeFournisseurService = inject(CommandeFournisseurService);

  demandes = signal<DemandeProduit[]>([]);
  pieces = signal<Produit[]>([]);
  activeOrders = signal<Commande[]>([]);
  activeTab: 'pending' | 'orders' | 'history' = 'pending';

  fournisseurs = signal<Fournisseur[]>([]);
  // Variables for Indirect Order (from demand)
  showOrderModal = signal(false);
  selectedDemandeForOrder = signal<DemandeProduit | null>(null);
  observationOrder = signal<string>('');

  // Variables for Direct Order (Admin)
  showDirectOrderModal = signal(false);
  directOrderItems = signal<{ produitId: number | null, quantite: number }[]>([{ produitId: null, quantite: 1 }]);
  observationDirect = signal<string>('');

  // Common order variables
  selectedFournisseurId = signal<number | null>(null);
  selectedDateLivraison = signal<string>('');
  orderLoading = signal(false);

  todayDate: string = new Date().toISOString().split('T')[0];

  pendingCount = computed(() => {
    return this.demandes().filter(d => {
      const s = (d.statut || '').toUpperCase().trim();
      return s === 'EN_ATTENTE' || s === 'EN_ATTENTE_COMMANDE' || s.includes('ADMIN');
    }).length;
  });

  activeOrdersCount = computed(() => this.activeOrders().filter(c => c.statut === 'EN_COURS').length);

  ngOnInit() {
    this.loadDemandes();
    this.loadPieces();
    this.loadFournisseurs();
    this.loadActiveOrders();
  }

  loadPieces() {
    this.pieceService.getPieces().subscribe({
      next: (data) => this.pieces.set(data),
      error: (err) => console.error('Erreur chargement pièces', err)
    });
  }

  loadFournisseurs() {
    this.fournisseurService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs.set(data.filter(f => f.statut === 'ACTIF'));
      },
      error: (err) => console.error('Erreur chargement fournisseurs', err)
    });
  }

  loadDemandes() {
    this.demandeService.getDemandes().subscribe({
      next: (data) => {
        this.demandes.set(data.reverse());
      },
      error: (err) => {
        console.error('Erreur chargement demandes', err);
        this.toastService.show('Erreur de chargement des demandes', 'error');
      }
    });
  }

  loadActiveOrders() {
    this.commandeFournisseurService.getAllCommandes().subscribe({
      next: (data) => {
        // Convertir les dates string en Date
        const convertedData = data.map(c => ({
          ...c,
          dateCommande: c.dateCommande ? new Date(c.dateCommande) : undefined,
          dateReceptionPrevue: c.dateReceptionPrevue ? new Date(c.dateReceptionPrevue) : undefined
        }));
        this.activeOrders.set(convertedData.reverse());
      },
      error: (err) => console.error('Erreur chargement commandes', err)
    });
  }

  filteredDemandes() {
    const list = this.demandes();
    if (this.activeTab === 'pending') {
      return list.filter(d => {
        const s = (d.statut || '').toUpperCase().trim();
        return s === 'EN_ATTENTE' || s === 'EN_ATTENTE_COMMANDE' || s.includes('ADMIN');
      });
    } else if (this.activeTab === 'history') {
      return list.filter(d => {
        const s = (d.statut || '').toUpperCase().trim();
        return s === 'VALIDATED' || s === 'REFUSED' || s === 'TRAITEE';
      });
    }
    return [];
  }

  getFilteredDemandesFlattened(): DemandeLigneRow[] {
    // Créer un tableau flattened : une ligne pour chaque pièce
    const flattenedRows: DemandeLigneRow[] = [];

    this.filteredDemandes().forEach(d => {
      if (!d.lignes || d.lignes.length === 0) {
        // Si pas de lignes, créer une ligne vide
        flattenedRows.push({
          demande: d,
          pieceName: '-',
          quantite: 0,
          produitId: undefined
        });
      } else {
        // UNE LIGNE PAR PIÈCE - complètement indépendante
        d.lignes.forEach(ligne => {
          // Essayer d'obtenir le nom : d'abord le produit, puis la liste, puis l'ID
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

          // Créer une ligne complètement indépendante pour cette pièce
          flattenedRows.push({
            demande: d,
            pieceName: pieceName,
            quantite: ligne.quantite || 0,
            produitId: ligne.produitId
          });
        });
      }
    });

    return flattenedRows;
  }

  getFilteredCommandesFlattened(): CommandeLigneRow[] {
    const flattenedRows: CommandeLigneRow[] = [];

    this.activeOrders().forEach(c => {
      if (!c.lignes || c.lignes.length === 0) {
        flattenedRows.push({
          commande: c,
          pieceName: '-',
          quantite: 0,
          produitId: undefined
        });
      } else {
        c.lignes.forEach(ligne => {
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

          flattenedRows.push({
            commande: c,
            pieceName: pieceName,
            quantite: ligne.quantite || 0,
            produitId: ligne.produitId
          });
        });
      }
    });

    return flattenedRows;
  }

  updateStatus(demande: DemandeProduit, newStatut: string) {
    if (!demande.id) return;
    this.demandeService.updateStatutDemande(demande.id, newStatut).subscribe({
      next: () => {
        this.toastService.show(`Demande mise à jour vers ${newStatut}`, 'success');
        this.loadDemandes();
      },
      error: (err) => this.toastService.show('Erreur de mise à jour', 'error')
    });
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
    this.commandeFournisseurService.creerCommande(demande.id, fournisseurId, dateLivraison, this.observationOrder()).subscribe({
      next: () => {
        this.toastService.show('Commande créée avec succès (Statut: COMMANDEE)', 'success');
        this.loadDemandes();
        this.loadActiveOrders();
        this.closeOrderModal();
      },
      error: (err) => {
        this.toastService.show('Erreur lors de la commande', 'error');
        this.orderLoading.set(false);
      }
    });
  }

  receptionner(commande: Commande) {
    if (!commande.id) return;
    this.commandeFournisseurService.receptionnerCommande(commande.id).subscribe({
      next: () => {
        this.toastService.show('Livraison réceptionnée ! Stock mis à jour et demande terminée.', 'success');
        this.loadDemandes();
        this.loadActiveOrders();
      },
      error: (err) => this.toastService.show('Erreur lors de la réception', 'error')
    });
  }

  getInitial(user: any): string {
    if (user && user.prenom) return user.prenom.charAt(0).toUpperCase();
    return 'M';
  }

  getStatusClass(statut: string | undefined): string {
    if (!statut) return 'EN_ATTENTE';
    const s = statut.toUpperCase().trim();
    if (s === 'VALIDATED' || s === 'TRAITEE') return 'VALIDATED';
    if (s === 'REFUSED') return 'REFUSED';
    if (s === 'COMMANDEE') return 'COMMANDE';
    return 'EN_ATTENTE';
  }

  formatStatut(statut: string | undefined): string {
    if (!statut) return 'En attente';
    const s = statut.toUpperCase().trim();
    if (s === 'VALIDATED' || s === 'VALIDE') return 'VALIDÉE (STOCK)';
    if (s === 'TRAITEE') return 'TRAITÉE (LIVRÉE)';
    if (s === 'REFUSED') return 'REFUSÉE';
    if (s === 'COMMANDEE') return 'COMMANDE';
    if (s === 'EN_ATTENTE_COMMANDE' || s.includes('ADMIN')) return 'À COMMANDER';
    return statut;
  }

  getProduitDesignation(demande: DemandeProduit): string {
    if (!demande.lignes || demande.lignes.length === 0) return 'N/A';
    return demande.lignes.map((l: any) => l.produit?.designation || 'Produit').join(', ');
  }

  getTotalQuantite(demande: DemandeProduit): number {
    if (!demande.lignes || demande.lignes.length === 0) return 0;
    return demande.lignes.reduce((sum: number, ligne: any) => sum + (ligne.quantite || 0), 0);
  }

  getCommandeProduitDesignation(commande: Commande): string {
    if (!commande.lignes || commande.lignes.length === 0) return 'N/A';
    return commande.lignes.map((l: any) => l.produit?.designation || 'Produit').join(', ');
  }

  getCommandeTotalQuantite(commande: Commande): number {
    if (!commande.lignes || commande.lignes.length === 0) return 0;
    return commande.lignes.reduce((sum: number, ligne: any) => sum + (ligne.quantite || 0), 0);
  }

  openOrderModal(demande: DemandeProduit) {
    this.selectedDemandeForOrder.set(demande);
    this.selectedFournisseurId.set(null);
    this.selectedDateLivraison.set('');
    this.observationOrder.set('');
    this.showOrderModal.set(true);
  }

  closeOrderModal() {
    this.showOrderModal.set(false);
    this.selectedDemandeForOrder.set(null);
    this.selectedFournisseurId.set(null);
    this.selectedDateLivraison.set('');
    this.observationOrder.set('');
    this.orderLoading.set(false);
  }

  openDirectOrderModal() {
    this.directOrderItems.set([{ produitId: null, quantite: 1 }]);
    this.selectedFournisseurId.set(null);
    this.selectedDateLivraison.set('');
    this.observationDirect.set('');
    this.showDirectOrderModal.set(true);
  }

  closeDirectOrderModal() {
    this.showDirectOrderModal.set(false);
    this.directOrderItems.set([{ produitId: null, quantite: 1 }]);
    this.selectedFournisseurId.set(null);
    this.selectedDateLivraison.set('');
    this.observationDirect.set('');
    this.orderLoading.set(false);
  }

  addDirectOrderLine() {
    this.directOrderItems.update(items => [...items, { produitId: null, quantite: 1 }]);
  }

  removeDirectOrderLine(index: number) {
    this.directOrderItems.update(items => items.filter((_, i) => i !== index));
    if (this.directOrderItems().length === 0) {
      this.addDirectOrderLine();
    }
  }

  submitDirectOrder() {
    const items = this.directOrderItems();
    const fournisseurId = this.selectedFournisseurId();
    const dateLivraison = this.selectedDateLivraison();
    const observation = this.observationDirect();

    const validItems = items.filter(item => item.produitId && item.quantite > 0);

    if (validItems.length === 0 || !fournisseurId) {
      this.toastService.show('Veuillez sélectionner au moins un produit et un fournisseur.', 'warning');
      return;
    }

    this.orderLoading.set(true);
    this.commandeFournisseurService.creerCommandeDirecte(validItems, fournisseurId, dateLivraison, observation).subscribe({
      next: () => {
        this.toastService.show('Commande directe créée avec succès !', 'success');
        this.activeTab = 'orders';
        this.loadActiveOrders();
        this.closeDirectOrderModal();
      },
      error: (err) => {
        this.toastService.show('Erreur lors de la commande directe', 'error');
        this.orderLoading.set(false);
      }
    });
  }
}

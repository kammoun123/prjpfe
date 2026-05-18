import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeProduitService } from '../../Services/demande-produit.service';
import { NotificationService } from '../../Services/notification.service';
import { ToastService } from '../../Services/toast.service';
import { DemandeProduit } from '../../models/demande-produit.model';
import { FournisseurService } from '../../Services/fournisseur.service';
import { Fournisseur } from '../../models/fournisseur.model';
import { FormsModule } from '@angular/forms';
import { CommandeFournisseurService, Commande } from '../../Services/commande-fournisseur.service';

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
  private commandeFournisseurService = inject(CommandeFournisseurService);

  demandes = signal<DemandeProduit[]>([]);
  activeOrders = signal<Commande[]>([]);
  activeTab: 'pending' | 'orders' | 'history' = 'pending';

  fournisseurs = signal<Fournisseur[]>([]);
  showOrderModal = signal(false);
  selectedDemandeForOrder = signal<DemandeProduit | null>(null);
  selectedFournisseurId = signal<number | null>(null);
  selectedDateLivraison = signal<string>('');
  orderLoading = signal(false);

  pendingCount = computed(() => {
    return this.demandes().filter(d => {
      const s = (d.statut || '').toUpperCase().trim();
      return s === 'EN_ATTENTE' || s === 'EN_ATTENTE_COMMANDE' || s.includes('ADMIN');
    }).length;
  });

  activeOrdersCount = computed(() => this.activeOrders().filter(c => c.statut === 'EN_COURS').length);

  ngOnInit() {
    this.loadDemandes();
    this.loadFournisseurs();
    this.loadActiveOrders();
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
      next: (data) => this.activeOrders.set(data.reverse()),
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
    this.commandeFournisseurService.creerCommande(demande.id, fournisseurId, dateLivraison).subscribe({
      next: () => {
        this.toastService.show('Commande fournisseur créée avec succès (Statut: COMMANDEE)', 'success');
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
    if (s === 'COMMANDEE') return 'COMMANDE FOURNISSEUR';
    if (s === 'EN_ATTENTE_COMMANDE' || s.includes('ADMIN')) return 'À COMMANDER';
    return statut;
  }

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
}

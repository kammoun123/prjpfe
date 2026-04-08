import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inventaire } from '../models/inventaire.model';
import { InventaireService } from '../Services/inventaire.service';
import { ProduitService } from '../Services/produit.service';
import { Produit } from '../models/produit.model';
import { NotificationService } from '../Services/notification.service';
import { AuthService } from '../Services/auth.service';
import { ToastService } from '../Services/toast.service';

declare var jspdf: any;

interface AuditItem extends Produit {
  quantiteReelle: number;
  ecart: number;
}

interface RapportAudit {
  id: string;
  titre: string;
  date: string;
  conforme: boolean;
  data: AuditItem[];
}

@Component({
  selector: 'app-controleur-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './controleur-dashboard.component.html',
  styleUrls: ['./controleur-dashboard.component.css']
})
export class ControleurDashboardComponent implements OnInit, OnDestroy {
  // Logic helpers
  Math = Math;

  // Services (inject() allows Signal usage as class properties)
  private inventaireService = inject(InventaireService);
  private produitService = inject(ProduitService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Tabs
  currentTab: 'dashboard' | 'inventories' | 'reports' = 'dashboard';

  // Profil
  profil: any = null;

  // Modals
  showProfileModal = false;
  showReportModal = false;
  showVerificationModal = false;
  isViewing = false;

  // Data
  piecesReport: AuditItem[] = [];
  piecesDeficit: Produit[] = [];
  inventaires: Inventaire[] = [];
  rapports: RapportAudit[] = [];
  pieces: Produit[] = [];

  // Notifications (reactive Signals - safe because inject() runs at field init time)
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  showNotifDropdown = false;
  private pollingId: any;

  // Stats
  totalStockUnits = 0;
  alertCount = 0;

  // Scheduling
  inventoryStatus: 'À JOUR' | 'EN RETARD' | 'EN COURS' = 'À JOUR';
  nextInventoryDate: string = '';
  daysUntilNext: number = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  private ngZone = inject(NgZone);

  ngOnInit(): void {
    this.loadInitialData();
    // Poll notifications every 10s outside Angular zone to prevent UI lag
    this.ngZone.runOutsideAngular(() => {
      this.pollingId = setInterval(() => {
        this.ngZone.run(() => {
          this.notificationService.fetchNotificationsForRole('CONTROLEUR').subscribe();
        });
      }, 10000);
    });
  }

  ngOnDestroy(): void {
    if (this.pollingId) clearInterval(this.pollingId);
  }

  loadInitialData() {
    this.profil = this.authService.getCurrentUser();
    this.loadPieces();
    this.loadInventaires();
    // Initial fetch of notifications for this role
    this.notificationService.fetchNotificationsForRole('CONTROLEUR').subscribe();
    if (isPlatformBrowser(this.platformId)) {
      const savedRapports = localStorage.getItem('controleur_rapports');
      if (savedRapports) {
        try {
          this.rapports = JSON.parse(savedRapports);
        } catch (e) {
          console.error("Erreur parsing rapports", e);
        }
      }
    }
  }

  setTab(tab: 'dashboard' | 'inventories' | 'reports') {
    this.currentTab = tab;
  }

  loadPieces() {
    this.produitService.getPieces().subscribe(data => {
      this.pieces = data;
      this.calculateStats();
    });
  }

  calculateStats() {
    this.totalStockUnits = this.pieces.length;
    this.alertCount = this.pieces.filter(p => p.quantiteStock <= p.seuilAlerte).length;
    this.piecesDeficit = this.pieces.filter(p => p.quantiteStock <= p.seuilAlerte);
  }

  loadNotifications() {
    this.notificationService.fetchNotificationsForRole('CONTROLEUR').subscribe();
  }

  loadInventaires() {
    this.inventaireService.getInventaires().subscribe(data => {
      this.inventaires = data.reverse();
      this.updateScheduling();
    });
  }

  updateScheduling() {
    const hasInProgress = this.inventaires.some(inv => inv.statut === 'En cours');
    if (hasInProgress) {
      this.inventoryStatus = 'EN COURS';
    } else {
      // Logic for weekly inventory (dummy logic for now: next is always Monday)
      const now = new Date();
      const nextMon = new Date(now);
      nextMon.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
      if (nextMon.toDateString() === now.toDateString()) {
        // Today is Monday, if no inventory today -> EN RETARD (simplified)
        this.inventoryStatus = 'EN RETARD';
      } else {
        this.inventoryStatus = 'À JOUR';
      }
      this.nextInventoryDate = nextMon.toISOString();
      this.daysUntilNext = Math.ceil((nextMon.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // UI Handlers
  toggleNotifDropdown() {
    this.showNotifDropdown = !this.showNotifDropdown;
  }

  markAsRead(notif: any) {
    if (notif.idNotification && notif.statut === 'NON_LUE') {
      this.notificationService.markAsRead(notif.idNotification).subscribe(() => {
        this.notificationService.fetchNotificationsForRole('CONTROLEUR').subscribe();
      });
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notificationService.fetchNotificationsForRole('CONTROLEUR').subscribe();
    });
  }

  modifierProfil() {
    this.showProfileModal = true;
  }

  sauvegarderProfil() {
    if (this.profil) {
      this.authService.updateUser(this.profil.idUtilisateur, this.profil).subscribe(() => {
        this.showProfileModal = false;
      });
    }
  }

  seDeconnecter() {
    this.authService.logout();
    window.location.href = '/login';
  }

  // Inventory logic
  nouveauInventaire() {
    const newInv: Partial<Inventaire> = {
      dateDebut: new Date().toISOString(),
      statut: 'En cours'
    };
    this.inventaireService.addInventaire(newInv as Inventaire).subscribe((res) => {
      this.loadInventaires();
      this.sendNotification(`Nouvel inventaire #${res.idInventaire || res.id} démarré.`);
    });
  }

  validerInventaire(inv: Inventaire) {
    const targetId = inv.id || inv.idInventaire;
    if (targetId !== undefined) {
      this.inventaireService.updateInventaire(targetId, { statut: 'Validé', dateFin: new Date().toISOString() }).subscribe(() => {
        this.toastService.show(`Inventaire #${targetId} validé avec succès !`, 'success');
        this.loadInventaires();
        this.sendNotification(`L'inventaire #${targetId} a été validé.`);
      });
    }
  }

  refuserInventaire(inv: Inventaire) {
    const targetId = inv.id || inv.idInventaire;
    if (targetId !== undefined) {
      this.inventaireService.updateInventaire(targetId, { statut: 'Refusé', dateFin: new Date().toISOString() }).subscribe(() => {
        this.toastService.show(`Inventaire #${targetId} rejeté.`, 'error');
        this.loadInventaires();
        this.sendNotification(`L'inventaire #${targetId} a été refusé.`, "warning");
      });
    }
  }

  supprimerInventaire(inv: Inventaire) {
    const targetId = inv.id || inv.idInventaire;
    if (targetId !== undefined) {
      if (confirm(`Voulez-vous vraiment supprimer l'inventaire #${targetId} ?`)) {
        this.inventaireService.deleteInventaire(targetId).subscribe(() => {
          this.loadInventaires();
        });
      }
    }
  }

  // Audit logic
  genererRapport() {
    this.produitService.getPieces().subscribe(data => {
      this.piecesReport = data.map(p => ({
        ...p,
        quantiteReelle: p.quantiteStock,
        ecart: 0
      }));
      this.isViewing = false;
      this.showReportModal = true;
    });
  }

  updateItemEcart(item: AuditItem) {
    item.ecart = item.quantiteReelle - item.quantiteStock;
  }

  fermerRapport() {
    if (!this.isViewing) {
      const now = new Date();
      const isConforme = this.piecesReport.every(p => p.ecart === 0);
      const newRapport: RapportAudit = {
        id: now.getTime().toString(),
        titre: `Audit du ${now.toLocaleDateString()}`,
        date: now.toISOString(),
        conforme: isConforme,
        data: [...this.piecesReport]
      };
      this.rapports.unshift(newRapport);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('controleur_rapports', JSON.stringify(this.rapports));
      }
    }
    this.showReportModal = false;
  }

  voirRapport(rapport: RapportAudit) {
    this.piecesReport = rapport.data;
    this.isViewing = true;
    this.showReportModal = true;
  }

  exporterEnPDF() {
    try {
      const GlobalJsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
      if (!GlobalJsPDF) {
        this.toastService.show("Bibliothèque PDF non chargée.", "error");
        return;
      }

      const doc = new GlobalJsPDF();
      doc.setFontSize(22);
      doc.text("RAPPORT D'AUDIT G-PIÈCES", 20, 20);
      doc.setFontSize(14);
      doc.text(`Date: ${new Date().toLocaleString()}`, 20, 30);
      doc.text(`Contrôleur: ${this.profil?.nom || ''} ${this.profil?.prenom || ''}`, 20, 40);

      let y = 60;
      doc.setFontSize(10);
      doc.text("REFERENCE | DESIGNATION | SYSTEME | REEL | ECART", 20, y);
      doc.line(20, y + 2, 190, y + 2);

      this.piecesReport.forEach(p => {
        y += 10;
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${p.reference} | ${p.designation.substring(0, 20)} | ${p.quantiteStock} | ${p.quantiteReelle} | ${p.ecart}`, 20, y);
      });

      doc.save(`Rapport_Audit_${Date.now()}.pdf`);
      this.toastService.show("PDF généré avec succès !");
    } catch (err) {
      this.toastService.show("Erreur PDF.", "error");
    }
  }

  envoyerAAdmin() {
    this.notificationService.createNotification({
      produitId: null as any,
      message: `Nouveau rapport d'audit envoyé par ${this.profil?.nom || 'Contrôleur'}.`,
      typeNotification: 'info',
      dateCreation: new Date().toISOString(),
      statut: 'NON_LUE',
      roleCible: 'ADMIN'
    }).subscribe(() => {
      this.toastService.show("Rapport envoyé à l'administration !", "success");
    });
  }

  envoyerRapportGeneral() {
    const msg = `Rapport Général: ${this.totalStockUnits} unités en stock, ${this.alertCount} alertes actives.`;
    this.notificationService.createNotification({
      produitId: null as any,
      message: msg,
      typeNotification: this.alertCount > 0 ? 'warning' : 'success',
      dateCreation: new Date().toISOString(),
      statut: 'NON_LUE',
      roleCible: 'ADMIN'
    }).subscribe(() => {
      this.toastService.show("Rapport général envoyé.", "success");
    });
  }

  verifierStock() {
    this.showVerificationModal = true;
    this.calculateStats();
  }

  fermerVerification() {
    this.showVerificationModal = false;
  }

  modifierStock(piece: Produit) {
    const val = prompt(`Ajuster le stock de ${piece.designation} :`, piece.quantiteStock.toString());
    if (val !== null) {
      const qte = parseInt(val);
      if (!isNaN(qte) && qte >= 0) {
        piece.quantiteStock = qte;
        this.produitService.updateProduit(piece.idProduit!, piece).subscribe(() => {
          this.toastService.show("Stock mis à jour.", "success");
          this.calculateStats();
        });
      }
    }
  }

  private sendNotification(msg: string, type: string = 'info') {
    this.notificationService.createNotification({
      produitId: null as any,
      message: msg,
      typeNotification: type,
      dateCreation: new Date().toISOString(),
      statut: 'NON_LUE',
      roleCible: 'CONTROLEUR'
    }).subscribe(() => this.loadNotifications());
  }
}

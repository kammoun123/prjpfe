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
import { ActivatedRoute } from '@angular/router';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


interface AuditItem extends Produit {
  quantiteReelle: number;
  ecart: number;
  observation?: string;
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
  private route = inject(ActivatedRoute);

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
  today = new Date();
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

    // Sync tab with URL
    const path = window.location.pathname;
    if (path.includes('inventories')) this.currentTab = 'inventories';
    else if (path.includes('reports')) this.currentTab = 'reports';
    else this.currentTab = 'dashboard';

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
    const notifId = notif.id || notif.idNotification;
    if (notifId && notif.statut === 'NON_LUE') {
      this.notificationService.markAsRead(notifId).subscribe(() => {
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
        ecart: 0,
        observation: ''
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

      // Persist to database as an Inventaire record with lines
      const newInv: any = {
        dateDebut: now.toISOString(),
        dateFin: now.toISOString(),
        statut: 'Validé',
        description: `Audit clôturé par ${this.profil?.nom || 'Contrôleur'}`,
        lignes: this.piecesReport.map(p => ({
          produit: { idProduit: p.idProduit }, // Clean object: ONLY ID to avoid Jackson errors
          idProduit: p.idProduit,
          id_produit: p.idProduit,
          quantiteTheorique: p.quantiteStock,
          quantite_theorique: p.quantiteStock,
          quantiteReelle: p.quantiteReelle,
          quantite_reelle: p.quantiteReelle,
          quantitePhysique: p.quantiteReelle,
          quantite_physique: p.quantiteReelle,
          ecart: p.ecart,
          observation: p.observation
        }))
      };

      this.inventaireService.addInventaire(newInv).subscribe((savedInv) => {
        const id = savedInv.idInventaire || savedInv.id;
        const msg = `Nouveau rapport d'audit détaillé #${id} envoyé par ${this.profil?.nom || 'Contrôleur'}.`;
        this.broadcastNotification(msg, isConforme ? 'success' : 'warning');
        this.loadInventaires(); // Refresh local list
      });

      // Also keep local history for immediate feedback
      const newRapport: RapportAudit = {
        id: now.getTime().toString(),
        titre: `Audit du ${now.toLocaleDateString()}`,
        date: now.toISOString(),
        conforme: isConforme,
        data: [...this.piecesReport]
      };
      this.rapports.unshift(newRapport);
      this.saveRapports();
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
      const doc = new jsPDF();
      const now = new Date();
      const dateStr = now.toLocaleString();
      const reportId = `AUD-${now.getTime()}`;

      // --- HEADER ---
      doc.setFillColor(13, 148, 136); // Teal primary color
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text("G-PIÈCES", 20, 20);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text("RAPPORT D'AUDIT DE STOCK", 20, 30);

      doc.setFontSize(10);
      doc.text(`ID Rapport: #${reportId}`, 150, 20);
      doc.text(`Généré le: ${dateStr}`, 150, 28);

      // --- INFO SECTION ---
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Informations Générales", 20, 55);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Contrôleur : ${this.profil?.nom || ''} ${this.profil?.prenom || ''}`, 20, 65);
      doc.text(`Email : ${this.profil?.email || ''}`, 20, 72);
      doc.text(`Nombre d'articles : ${this.piecesReport.length}`, 140, 65);

      const conforme = this.piecesReport.every(p => p.ecart === 0);
      doc.setTextColor(conforme ? 22 : 220, conforme ? 163 : 38, conforme ? 74 : 38);
      doc.setFont('helvetica', 'bold');
      doc.text(`État Global : ${conforme ? 'CONFORME' : 'ANOMALIES DÉTECTÉES'}`, 140, 72);

      // --- TABLE ---
      autoTable(doc, {
        startY: 85,
        head: [['RÉFÉRENCE', 'DÉSIGNATION', 'SYSTÈME', 'RÉEL', 'ÉCART', 'OBSERVATION']],
        body: this.piecesReport.map(p => [
          p.reference,
          p.designation,
          p.quantiteStock.toString(),
          p.quantiteReelle.toString(),
          { content: (p.ecart > 0 ? '+' : '') + p.ecart, styles: { fontStyle: 'bold', textColor: p.ecart === 0 ? [30, 41, 59] : (p.ecart > 0 ? [22, 163, 74] : [220, 38, 38]) } },
          p.observation || (p.ecart === 0 ? 'Conforme' : 'Anomalie')
        ]),
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 20 },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      // --- FOOTER ---
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Document généré automatiquement par G-PIÈCES - Page ${i} / ${pageCount}`, 105, 285, { align: 'center' });
      }

      doc.save(`G-Pieces_Audit_${reportId}.pdf`);
      this.toastService.show("Rapport PDF généré avec succès !", "success");
    } catch (err) {
      console.error("Erreur PDF:", err);
      this.toastService.show("Erreur lors de la génération du PDF.", "error");
    }
  }

  envoyerAAdmin() {
    // Before sending notification, we must save this audit in the database as a "Validé" inventory
    // so the admin can actually see the rows.
    const now = new Date();
    const newInv: any = {
      dateDebut: now.toISOString(),
      dateFin: now.toISOString(),
      statut: 'Validé',
      description: `Audit détaillé soumis par ${this.profil?.nom || 'Contrôleur'}`,
      lignes: this.piecesReport.map(p => ({
        produit: { idProduit: p.idProduit }, // Clean: ID ONLY to prevent Jackson deserialization failure
        idProduit: p.idProduit,
        id_produit: p.idProduit,
        quantiteTheorique: p.quantiteStock,
        quantite_theorique: p.quantiteStock,
        quantiteReelle: p.quantiteReelle,
        quantite_reelle: p.quantiteReelle,
        quantitePhysique: p.quantiteReelle,
        quantite_physique: p.quantiteReelle,
        ecart: p.ecart,
        observation: p.observation
      }))
    };

    this.inventaireService.addInventaire(newInv).subscribe((saved) => {
      const id = saved.idInventaire || saved.id;
      const msg = `Nouveau Rapport d'audit (#${id}) envoyé par ${this.profil?.nom || 'Contrôleur'}.`;
      this.broadcastNotification(msg, 'AUDIT_REPORT');
      this.toastService.show("Rapport envoyé à l'administration !", "success");
      this.loadInventaires();
      this.showReportModal = false;
    });
  }

  envoyerRapportGeneral() {
    const msg = `Rapport Général: ${this.totalStockUnits} unités en stock, ${this.alertCount} alertes actives.`;

    // Save to database as an Inventaire record so others can see it
    const now = new Date();
    const newInv: Partial<Inventaire> = {
      dateDebut: now.toISOString(),
      dateFin: now.toISOString(),
      statut: 'Validé',
      description: msg
    };

    this.inventaireService.addInventaire(newInv as Inventaire).subscribe((savedInv) => {
      // Also add lines for the general report to ensure Admin sees the detailed state
      // Actually, if we want detailed lines, we should send them now.
      const id = savedInv.idInventaire || savedInv.id;

      // Update the inventory with lines from piecesReport
      const lignes = this.pieces.map(p => ({
        produit: { idProduit: p.idProduit },
        id_produit: p.idProduit,
        quantiteTheorique: p.quantiteStock,
        quantite_theorique: p.quantiteStock,
        quantiteReelle: p.quantiteStock,
        quantite_reelle: p.quantiteStock,
        quantitePhysique: p.quantiteStock,
        quantite_physique: p.quantiteStock,
        ecart: 0
      }));

      if (id !== undefined) {
        this.inventaireService.updateInventaire(id, { lignes: lignes } as any).subscribe(() => {
          this.broadcastNotification(`${msg} (ID: #${id})`, this.alertCount > 0 ? 'warning' : 'AUDIT_REPORT');
          this.loadInventaires(); // Refresh local list
        });
      }
    });

    // Add to local session history
    const newRapport: RapportAudit = {
      id: now.getTime().toString(),
      titre: `Rapport Général du ${now.toLocaleDateString()}`,
      date: now.toISOString(),
      conforme: this.alertCount === 0,
      data: []
    };
    this.rapports.unshift(newRapport);
    this.saveRapports();

    this.toastService.show("Rapport général généré et transmis.", "success");
  }

  private saveRapports() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('controleur_rapports', JSON.stringify(this.rapports));
    }
  }

  private broadcastNotification(message: string, type: string = 'AUDIT_REPORT') {
    const roles = ['ADMIN', 'MAGASINIER'];
    roles.forEach(role => {
      this.notificationService.createNotification({
        produitId: null as any,
        message: message,
        typeNotification: type,
        dateCreation: new Date().toISOString(),
        statut: 'NON_LUE',
        roleCible: role
      }).subscribe();
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

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventaireService } from '../../Services/inventaire.service';
import { Inventaire } from '../../models/inventaire.model';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-audit-rapport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-rapport.component.html',
  styleUrl: './audit-rapport.component.css'
})
export class AuditRapportComponent implements OnInit {
  private inventaireService = inject(InventaireService);
  private authService = inject(AuthService);
  profil: any = null;
  inventaires = signal<Inventaire[]>([]);
  today = new Date();
  
  showModal = signal(false);
  selectedAudit = signal<any>(null);

  // Filtering signals
  searchTerm = signal('');
  searchDate = signal('');
  showFilters = signal(false);
  
  // Computed Stats for Admin-style dashboard
  totalAudits = computed(() => this.inventaires().length);
  validatedAudits = computed(() => this.inventaires().filter(i => this.isStatutValide(i.statut)).length);
  rejectedAudits = computed(() => this.inventaires().filter(i => !this.isStatutValide(i.statut)).length);

  ngOnInit() { 
    this.profil = this.authService.getCurrentUser();
    this.loadInventaires(); 
  }

  loadInventaires() {
    this.inventaireService.getInventaires().subscribe(data => {
      this.inventaires.set(data.sort((a,b) => {
        const dateA = a.dateDebut ? new Date(a.dateDebut).getTime() : 0;
        const dateB = b.dateDebut ? new Date(b.dateDebut).getTime() : 0;
        return dateB - dateA; // Newest first
      }));
    });
  }

  filteredInventaires() {
    let list = this.inventaires();
    const search = this.searchTerm().toLowerCase().trim();
    const dateQuery = this.searchDate();

    if (search) {
      list = list.filter(i => 
        (i.idInventaire?.toString() || i.id?.toString() || '').includes(search) ||
        (i.description?.toLowerCase() || '').includes(search)
      );
    }

    if (dateQuery) {
      list = list.filter(i => 
        i.dateDebut && new Date(i.dateDebut).toISOString().split('T')[0] === dateQuery
      );
    }

    return list;
  }

  getStatusClass(status: string | undefined) {
    if (!status) return 's-rejected';
    const s = status.toUpperCase();
    if (s === 'VALIDÉ' || s === 'VALIDE' || s === 'VALIDATED' || s === 'VALIDÉE') return 's-validated';
    return 's-rejected';
  }

  isStatutValide(status: string | undefined): boolean {
    if (!status) return false;
    const s = status.toUpperCase();
    return s === 'VALIDÉ' || s === 'VALIDE' || s === 'VALIDATED' || s === 'VALIDÉE';
  }

  getStatutLabel(status: string | undefined): string {
    return this.isStatutValide(status) ? 'VALIDE' : 'REFUSÉ';
  }

  voirRapport(item: Inventaire) {
    this.selectedAudit.set(item);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    setTimeout(() => this.selectedAudit.set(null), 200); // Wait for reverse animation if we had one
  }
  
  printReport() {
    this.exporterEnPDF();
  }

  exporterEnPDF() {
    const selected = this.selectedAudit();
    if (!selected) return;

    try {
      const doc = new jsPDF();
      const dateStr = selected.dateDebut ? new Date(selected.dateDebut).toLocaleString() : new Date().toLocaleString();
      const reportId = selected.idInventaire || selected.id || `AUD-${new Date().getTime()}`;

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
      doc.text(`Date: ${dateStr}`, 150, 28);

      // --- INFO SECTION ---
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Informations Générales", 20, 55);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Attempt to show the creator if in description or fallback
      let creator = "Utilisateur G-Pièces";
      if (selected.description && selected.description.includes('par ')) {
        const parts = selected.description.split('par ');
        if (parts.length > 1) {
          creator = parts[1].trim();
        }
      }

      doc.text(`Édité pour : ${this.profil?.nom || ''} ${this.profil?.prenom || ''}`, 20, 65);
      doc.text(`Créé par : ${creator}`, 20, 72);
      doc.text(`Nombre d'articles : ${selected.lignes?.length || 0}`, 140, 65);
      
      const conforme = this.isStatutValide(selected.statut);
      doc.setTextColor(conforme ? 22 : 220, conforme ? 163 : 38, conforme ? 74 : 38);
      doc.setFont('helvetica', 'bold');
      doc.text(`État Global : ${conforme ? 'CONFORME' : 'ANOMALIES DÉTECTÉES'}`, 140, 72);

      // --- TABLE ---
      const tableData = (selected.lignes || []).map((l: any) => {
        const theorique = l.quantiteTheorique ?? l.quantite_theorique ?? l.produit?.quantiteStock ?? 0;
        const reelle = l.quantiteReelle ?? l.quantite_reelle ?? l.quantitePhysique ?? l.quantite_physique ?? (theorique + (l.ecart ?? 0));
        const ecart = l.ecart ?? (reelle - theorique);
        return [
          l.produit?.reference || l.piece?.reference || 'N/A',
          l.produit?.designation || l.piece?.designation || 'Article Inconnu',
          theorique.toString(),
          reelle.toString(),
          { content: (ecart > 0 ? '+' : '') + ecart, styles: { fontStyle: 'bold', textColor: ecart === 0 ? [30, 41, 59] : (ecart > 0 ? [22, 163, 74] : [220, 38, 38]) } },
          l.observation || (ecart === 0 ? 'Conforme' : 'Anomalie')
        ];
      });

      autoTable(doc, {
        startY: 85,
        head: [['RÉFÉRENCE', 'DÉSIGNATION', 'SYSTÈME', 'RÉEL', 'ÉCART', 'OBSERVATION']],
        body: tableData,
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
    } catch (err) {
      console.error("Erreur PDF:", err);
      alert("Erreur lors de la génération du PDF.");
    }
  }
}

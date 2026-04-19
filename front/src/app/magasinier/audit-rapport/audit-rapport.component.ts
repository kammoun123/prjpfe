import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventaireService } from '../../Services/inventaire.service';
import { Inventaire } from '../../models/inventaire.model';

@Component({
  selector: 'app-audit-rapport',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-rapport.component.html',
  styleUrl: './audit-rapport.component.css'
})
export class AuditRapportComponent implements OnInit {
  private inventaireService = inject(InventaireService);
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

  ngOnInit() { this.loadInventaires(); }

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
    window.print();
  }
}

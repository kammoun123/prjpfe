import { Component, OnInit, inject, signal } from '@angular/core';
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
  
  showModal = signal(false);
  selectedAudit = signal<any>(null);

  ngOnInit() { this.loadInventaires(); }

  loadInventaires() {
    this.inventaireService.getInventaires().subscribe(data => {
      this.inventaires.set(data.reverse());
    });
  }

  filteredInventaires() { return this.inventaires(); }

  getStatusClass(status: string) {
    if (status === 'Validé' || status === 'VALIDATED' || status === 'VALIDÉE') return 's-validated';
    return 's-rejected';
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

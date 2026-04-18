import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PieceService } from '../../Services/piece.service';
import { DemandeProduitService } from '../../Services/demande-produit.service';
import { AuthService } from '../../Services/auth.service';
import { ToastService } from '../../Services/toast.service';
import { Produit } from '../../models/produit.model';
import { DemandeProduit } from '../../models/demande-produit.model';

@Component({
  selector: 'app-demande-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demande-admin.component.html',
  styleUrl: './demande-admin.component.css'
})
export class DemandeAdminComponent implements OnInit {
  private pieceService = inject(PieceService);
  private demandeService = inject(DemandeProduitService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  
  pieces = signal<Produit[]>([]);
  sending = signal(false);
  
  selectedPieceId: number | null = null;
  quantity: number = 0;
  
  historique = signal<any[]>([]);

  // Filtering Signals
  searchPiece = signal('');
  searchDate = signal('');

  // Computed Filtered List
  filteredHistory = computed(() => {
    const list = this.historique();
    const pieceFilter = this.searchPiece().toLowerCase().trim();
    const dateFilter = this.searchDate();

    return list.filter(d => {
      const matchesPiece = d.piece.toLowerCase().includes(pieceFilter);
      const matchesDate = !dateFilter || (d.date && d.date.toString().includes(dateFilter));
      return matchesPiece && matchesDate;
    });
  });

  ngOnInit() {
    this.loadPieces();
    this.loadHistory();
  }

  loadPieces() {
    this.pieceService.getPieces().subscribe(data => {
      this.pieces.set(data);
    });
  }

  loadHistory() {
    this.demandeService.getDemandes().subscribe(data => {
      const mapped = data.map(d => ({
        id: d.id,
        date: d.dateDemande,
        piece: d.produit ? d.produit.designation : 'Pièce Inconnue',
        quantite: d.quantite,
        statut: d.statut
      }));

      // Sort by date descending (newest first)
      mapped.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      this.historique.set(mapped);
    });
  }

  submit() {
    if (!this.selectedPieceId || this.quantity <= 0) return;
    
    this.sending.set(true);
    const currentUser = this.authService.getCurrentUser();
    
    const demande: DemandeProduit = {
      produitId: Number(this.selectedPieceId),
      quantite: this.quantity,
      statut: 'EN_ATTENTE',
      motif: 'Demande d\'achat Magasinier',
      technicienId: currentUser?.idUtilisateur || 0,
      dateDemande: new Date()
    };

    this.demandeService.createDemande(demande).subscribe({
      next: (res) => {
        this.toastService.show('Demande envoyée avec succès !', 'success');
        this.loadHistory();
        this.selectedPieceId = null;
        this.quantity = 0;
        this.sending.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de l\'envoi de la demande', err);
        this.toastService.show('Erreur lors de l\'envoi.', 'error');
        this.sending.set(false);
      }
    });
  }
}

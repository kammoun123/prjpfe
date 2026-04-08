import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PieceService } from '../../Services/piece.service';
import { Produit } from '../../models/produit.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-consultation-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultation-stock.component.html',
  styleUrl: './consultation-stock.component.css'
})
export class ConsultationStockComponent implements OnInit {
  private pieceService = inject(PieceService);
  
  allPieces: Produit[] = [];
  filteredPieces = signal<Produit[]>([]);
  totalStock = signal(0);
  criticalCount = signal(0);
  backendUrl = environment.apiUrl.replace('/api', '');
  
  searchTerm = '';
  filterStatus: 'all' | 'critical' | 'normal' = 'all';
  
  showModal = false;
  selectedPiece: Produit | null = null;
  newQuantity = 0;

  ngOnInit() { this.loadPieces(); }

  loadPieces() {
    this.pieceService.getPieces().subscribe(data => {
      this.allPieces = data;
      this.calculateStats();
      this.filterPieces();
    });
  }

  calculateStats() {
    this.totalStock.set(this.allPieces.reduce((acc, p) => acc + p.quantiteStock, 0));
    this.criticalCount.set(this.allPieces.filter(p => p.quantiteStock <= (p.seuilAlerte || 5)).length);
  }

  setFilter(status: 'all' | 'critical' | 'normal') {
    this.filterStatus = status;
    this.filterPieces();
  }

  filterPieces() {
    let result = this.allPieces;
    
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      result = result.filter(p => 
        p.reference.toLowerCase().includes(search) || 
        p.designation.toLowerCase().includes(search)
      );
    }
    
    if (this.filterStatus === 'critical') {
      result = result.filter(p => p.quantiteStock <= (p.seuilAlerte || 5));
    } else if (this.filterStatus === 'normal') {
      result = result.filter(p => p.quantiteStock > (p.seuilAlerte || 5));
    }
    
    this.filteredPieces.set(result);
  }

  getStockColorClass(p: Produit) {
    if (p.quantiteStock === 0) return 'text-danger';
    if (p.quantiteStock <= (p.seuilAlerte || 5)) return 'text-warning';
    return 'text-success';
  }

  getStatusBadgeClass(p: Produit) {
    if (p.quantiteStock === 0) return 'pill-error';
    if (p.quantiteStock <= (p.seuilAlerte || 5)) return 'pill-warning';
    return 'pill-success';
  }

  openAdjustModal(p: Produit) {
    this.selectedPiece = p;
    this.newQuantity = p.quantiteStock;
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  saveAdjustment() {
    if (this.selectedPiece && this.selectedPiece.idProduit) {
      this.pieceService.updatePiece(this.selectedPiece.idProduit, { quantiteStock: this.newQuantity }).subscribe(() => {
        this.loadPieces();
        this.closeModal();
      });
    }
  }
}

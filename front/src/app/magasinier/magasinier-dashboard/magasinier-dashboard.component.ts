import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PieceService } from '../../Services/piece.service';
import { DemandeProduitService } from '../../Services/demande-produit.service';
import { DemandeProduit } from '../../models/demande-produit.model';

@Component({
  selector: 'app-magasinier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './magasinier-dashboard.component.html',
  styleUrl: './magasinier-dashboard.component.css'
})
export class MagasinierDashboardComponent implements OnInit {
  private pieceService = inject(PieceService);
  private demandeService = inject(DemandeProduitService);

  totalStock = signal(0);
  criticalStock = signal<any[]>([]);
  recentDemandes = signal<DemandeProduit[]>([]);
  pendingRequests = signal<DemandeProduit[]>([]);
  processedCount = signal(0);
  currentPeriod = signal<'Hebdomadaire' | 'Mensuel'>('Hebdomadaire');
  activityData = signal<any[]>([]);

  private weekData = [
    { label: 'Mar', value: 45 },
    { label: 'Mer', value: 30 },
    { label: 'Jeu', value: 85 },
    { label: 'Ven', value: 55 },
    { label: 'Sam', value: 75 },
    { label: 'Dim', value: 20 },
    { label: 'Lun', value: 15 }
  ];

  private monthData = [
    { label: 'S1', value: 60 },
    { label: 'S2', value: 40 },
    { label: 'S3', value: 90 },
    { label: 'S4', value: 50 }
  ];

  ngOnInit() {
    this.activityData.set(this.weekData);
    this.pieceService.getPieces().subscribe(pieces => {
      this.totalStock.set(pieces.reduce((acc, p) => acc + p.quantiteStock, 0));
      this.criticalStock.set(pieces.filter(p => p.quantiteStock <= (p.seuilAlerte || 5)).slice(0, 5));
    });

    this.demandeService.getDemandes().subscribe(demandes => {
      const sorted = demandes.reverse();
      this.recentDemandes.set(sorted.slice(0, 5));
      this.pendingRequests.set(demandes.filter(d => {
        const s = (d.statut || '').toUpperCase();
        return s === 'EN_ATTENTE' || s === 'PENDING' || s === 'EN ATTENTE';
      }));
      this.processedCount.set(demandes.length - this.pendingRequests().length);
    });
  }

  switchPeriod(period: 'Hebdomadaire' | 'Mensuel') {
    this.currentPeriod.set(period);
    this.activityData.set(period === 'Hebdomadaire' ? this.weekData : this.monthData);
  }

  getStatusBadgeClass(status: string) {
    const s = (status || '').toUpperCase();
    if (s === 'EN_ATTENTE' || s === 'PENDING' || s === 'EN ATTENTE') return 'wait';
    return 'success';
  }
}

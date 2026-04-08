import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeProduit } from '../../models/demande-produit.model';
import { PieceService } from '../../Services/piece.service';
import { DemandePieceService } from '../../Services/demande-piece.service';
import { Produit as Piece } from '../../models/produit.model';
import { ToastService } from '../../Services/toast.service';

@Component({
  selector: 'app-technicien-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './technicien-dashboard.component.html',
  styleUrls: ['./technicien-dashboard.component.css']
})
export class TechnicienDashboardComponent implements OnInit {
    demandes: DemandeProduit[] = [];
    filteredDemandes: DemandeProduit[] = [];
    allPieces: Piece[] = [];
    searchTerm = '';
    filterStatut = 'All';
    filterDate = '';

    // Stats
    statsTotal = 0;
    statsPending = 0;
    statsValidated = 0;
    statsSuccessRate = 0;

    // Chart Data & Config
    chartData: { label: string, count: number, height: number }[] = [];
    chartPeriod: 'weekly' | 'monthly' = 'weekly';

    constructor(
        private pieceService: PieceService,
        private demandeService: DemandePieceService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        this.loadPieces();
        this.loadDemandes();
    }

    loadPieces(): void {
        this.pieceService.getPieces().subscribe({
            next: (data) => {
                this.allPieces = data;
            },
            error: (err) => console.error('Erreur chargement pièces', err)
        });
    }

    loadDemandes(): void {
        this.demandeService.getDemandes().subscribe({
            next: (data) => {
                this.demandes = data.sort((a, b) => new Date(b.dateDemande || new Date()).getTime() - new Date(a.dateDemande || new Date()).getTime());
                this.applyFilter();
                this.calculateStats();
                this.updateChartInfo();
            },
            error: (err) => console.error('Erreur chargement demandes', err)
        });
    }

    setChartPeriod(period: 'weekly' | 'monthly'): void {
        this.chartPeriod = period;
        this.updateChartInfo();
    }

    updateChartInfo(): void {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const result = [];
        const today = new Date();
        const iterations = this.chartPeriod === 'weekly' ? 7 : 30;

        for (let i = iterations - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const count = this.demandes.filter(req => {
                if (!req.dateDemande) return false;
                const reqDate = new Date(req.dateDemande).toISOString().split('T')[0];
                return reqDate === dateStr;
            }).length;

            const label = this.chartPeriod === 'weekly' 
                ? days[d.getDay()] 
                : d.getDate().toString();

            result.push({
                label: label,
                count: count,
                height: 0
            });
        }

        const maxCount = Math.max(...result.map(r => r.count), 1);
        this.chartData = result.map(r => ({
            ...r,
            height: Math.max((r.count / maxCount) * 100, 5)
        }));
    }

    calculateStats(): void {
        this.statsTotal = this.demandes.length;
        this.statsPending = this.demandes.filter(d => {
            const s = (d.statut || '').toLowerCase();
            return s.includes('attente') || s.includes('commande') || s.includes('en cours');
        }).length;
        this.statsValidated = this.demandes.filter(d => d.statut === 'Validée').length;
        this.statsSuccessRate = this.statsTotal > 0 ? Math.round((this.statsValidated / this.statsTotal) * 100) : 0;
    }

    getPieceReference(demande: DemandeProduit): string {
        if (demande.produit && demande.produit.designation) {
            return demande.produit.designation;
        }
        
        const pieceId = demande.produitId;
        if (!pieceId) return '-';
        
        const piece = this.allPieces.find(p => p.idProduit === pieceId);
        return piece ? piece.designation : `Pièce ID #${pieceId}`;
    }

    applyFilter(): void {
        this.filteredDemandes = this.demandes.filter(d => {
            const pieceRef = this.getPieceReference(d).toLowerCase();
            const motifStr = (d.motif || '').toLowerCase();
            
            const matchesSearch = motifStr.includes(this.searchTerm.toLowerCase()) ||
                pieceRef.includes(this.searchTerm.toLowerCase());

            const matchesStatus = this.filterStatut === 'All' || d.statut === this.filterStatut;

            let matchesDate = true;
            if (this.filterDate && d.dateDemande) {
                const dDate = new Date(d.dateDemande).toISOString().split('T')[0];
                matchesDate = dDate === this.filterDate;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }

    onSearch(term: string): void {
        this.searchTerm = term;
        this.applyFilter();
    }

    onFilterChange(status: string): void {
        this.filterStatut = status;
        this.applyFilter();
    }

    onDateChange(date: string): void {
        this.filterDate = date;
        this.applyFilter();
    }

    onDeleteDemande(id: any): void {
        if(!id) return;
        this.demandeService.deleteDemande(id).subscribe({
            next: () => {
                this.toastService.show('Demande supprimée avec succès', 'success');
                this.loadDemandes();
            },
            error: (err) => {
                this.toastService.show('Erreur lors de la suppression', 'error');
            }
        });
    }
}

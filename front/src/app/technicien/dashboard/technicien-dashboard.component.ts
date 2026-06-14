import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandeProduit } from '../../models/demande-produit.model';
import { PieceService } from '../../Services/piece.service';
import { DemandePieceService } from '../../Services/demande-piece.service';
import { Produit as Piece } from '../../models/produit.model';
import { ToastService } from '../../Services/toast.service';

// Interface pour les lignes du tableau (une ligne par pièce)
interface DemandeLigneRow {
  demande: DemandeProduit;
  pieceName: string;
  quantite: number;
  motif: string;
  dateCommande: Date | undefined;
  statut: string;
  idDemande: number;
}

@Component({
  selector: 'app-technicien-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './technicien-dashboard.component.html',
  styleUrls: ['./technicien-dashboard.component.css']
})
export class TechnicienDashboardComponent implements OnInit {
    demandes: DemandeProduit[] = [];
    filteredDemandes: DemandeLigneRow[] = [];
    allPieces: Piece[] = [];
    selectedDemande: DemandeProduit | null = null;
    showDetailsModal = false;
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
        this.statsValidated = this.demandes.filter(d => {
            const s = (d.statut || '').toUpperCase().trim();
            return s === 'VALIDÉE' || s === 'VALIDATED' || s === 'VALIDE' || s === 'VALIDÉ';
        }).length;
        this.statsSuccessRate = this.statsTotal > 0 ? Math.round((this.statsValidated / this.statsTotal) * 100) : 0;
    }

    getPieceReference(demande: DemandeProduit): string {
        if (!demande.lignes || demande.lignes.length === 0) return '-';
        
        // Get all piece references from lignes
        const references = demande.lignes.map(ligne => {
            if (ligne.produit && ligne.produit.designation) {
                return ligne.produit.designation;
            }
            const pieceId = ligne.produitId;
            if (!pieceId) return '-';
            const piece = this.allPieces.find(p => p.idProduit === pieceId);
            return piece ? piece.designation : `Pièce ID #${pieceId}`;
        }).filter(ref => ref !== '-');
        
        return references.length > 0 ? references.join(', ') : '-';
    }

    getTotalQuantite(demande: DemandeProduit): number {
        if (!demande.lignes || demande.lignes.length === 0) return 0;
        return demande.lignes.reduce((sum, ligne) => sum + (ligne.quantite || 0), 0);
    }

    getFirstMotif(demande: DemandeProduit): string {
        if (!demande.lignes || demande.lignes.length === 0) return '';
        return demande.lignes[0].motif || '';
    }

    applyFilter(): void {
        // Créer un tableau "flattened" : une ligne pour chaque pièce
        const flattenedRows: DemandeLigneRow[] = [];

        this.demandes.forEach(d => {
            if (!d.lignes || d.lignes.length === 0) {
                // Si pas de lignes, créer une ligne vide
                flattenedRows.push({
                    demande: d,
                    pieceName: '-',
                    quantite: 0,
                    motif: '',
                    dateCommande: d.dateDemande,
                    statut: d.statut,
                    idDemande: d.id || 0
                });
            } else {
                // Une ligne pour chaque pièce
                d.lignes.forEach(ligne => {
                    const pieceName = ligne.produit?.designation || 
                        this.allPieces.find(p => p.idProduit === ligne.produitId)?.designation || 
                        `Pièce ID #${ligne.produitId}`;
                    
                    flattenedRows.push({
                        demande: d,
                        pieceName: pieceName,
                        quantite: ligne.quantite || 0,
                        motif: ligne.motif || '',
                        dateCommande: d.dateDemande,
                        statut: d.statut,
                        idDemande: d.id || 0
                    });
                });
            }
        });

        // Appliquer les filtres
        this.filteredDemandes = flattenedRows.filter(row => {
            const matchesSearch = row.pieceName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                                 row.motif.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchesStatus = this.filterStatut === 'All' || row.statut === this.filterStatut;

            let matchesDate = true;
            if (this.filterDate && row.dateCommande) {
                const dDate = new Date(row.dateCommande).toISOString().split('T')[0];
                matchesDate = dDate === this.filterDate;
            }

            return matchesSearch && matchesStatus && matchesDate;
        }).sort((a, b) => {
            const dateA = a.dateCommande ? new Date(a.dateCommande).getTime() : 0;
            const dateB = b.dateCommande ? new Date(b.dateCommande).getTime() : 0;
            return dateB - dateA;
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

    openDetails(demande: DemandeProduit): void {
        this.selectedDemande = demande;
        this.showDetailsModal = true;
    }

    closeDetailsModal(): void {
        this.showDetailsModal = false;
        this.selectedDemande = null;
    }

    getPieceName(pieceName: string): string {
        return pieceName || 'Pièce Inconnue';
    }

    formatStatut(statut: string | undefined): string {
        if (!statut) return 'En attente';
        const s = statut.toUpperCase().trim();
        if (s === 'VALIDATED' || s === 'VALIDÉ' || s === 'VALIDÉE' || s === 'VALIDE') return 'VALIDE';
        if (s === 'REFUSED' || s === 'REFUSÉ' || s === 'REFUSE' || s === 'REJETÉE') return 'REJETÉE';
        if (s.includes('ATTENTE') || s.includes('COMMANDE') || s.includes('EN COURS')) return 'En attente';
        return statut;
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MouvementStockService } from '../../Services/mouvement-stock.service';
import { ProduitService } from '../../Services/produit.service';
import { AuthService } from '../../Services/auth.service';
import { MouvementStock } from '../../models/mouvement-stock.model';
import { Produit } from '../../models/produit.model';

@Component({
    selector: 'app-mouvement-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './mouvement-management.component.html',
    styleUrls: ['./mouvement-management.component.css']
})
export class MouvementManagementComponent implements OnInit {
    mouvements: MouvementStock[] = [];
    produits: Produit[] = [];

    newMouvement: any = {
        produitId: null,
        typeMouvement: 'ENTREE',
        quantite: 1,
        dateMouvement: new Date(),
        motif: ''
    };

    currentUserName: string = 'Admin';
    isMagasinier: boolean = false;

    // Filter properties
    showFilters = true;
    filterType = 'ALL';
    startDate = '';
    endDate = '';
    searchTerm = '';

    loading = false;

    constructor(
        private mouvementService: MouvementStockService,
        private produitService: ProduitService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.currentUserName = (user.prenom || '') + ' ' + (user.nom || '');
            this.currentUserName = this.currentUserName.trim() || 'Admin';
            this.isMagasinier = user.role === 'MAGASINIER';
            if (this.isMagasinier) {
                this.newMouvement.typeMouvement = 'SORTIE';
            }
        }
        this.initialiserPage();
    }

    get stats() {
        const source = this.filteredMouvements;
        const totalMovements = source.length;
        const totalEntries = source.filter(m => m.typeMouvement === 'ENTREE').reduce((acc, m) => acc + (m.quantite ?? 0), 0);
        const totalExits = source.filter(m => m.typeMouvement === 'SORTIE').reduce((acc, m) => acc + (m.quantite ?? 0), 0);

        return {
            total: totalMovements,
            entries: totalEntries,
            exits: totalExits,
            lastUpdate: new Date().toLocaleDateString()
        };
    }

    get filteredMouvements() {
        return this.mouvements.filter(m => {
            const matchesType = this.filterType === 'ALL' || m.typeMouvement === this.filterType;

            const mDate = new Date(m.dateMouvement).toISOString().split('T')[0];
            const matchesStart = !this.startDate || mDate >= this.startDate;
            const matchesEnd = !this.endDate || mDate <= this.endDate;

            const resolvedId = m.produitId || (m.produit as any)?.idProduit;
            const pieceName = this.getNomPiece(resolvedId).toLowerCase();
            const matchesSearch = !this.searchTerm || pieceName.includes(this.searchTerm.toLowerCase());

            return matchesType && matchesStart && matchesEnd && matchesSearch;
        });
    }

    initialiserPage() {
        this.loading = true;

        this.produitService.getPieces().subscribe(data => {
            this.produits = data;
            if (this.produits.length > 0) this.newMouvement.produitId = this.produits[0].idProduit;
        });

        this.mouvementService.getAllMouvements().subscribe({
            next: (data: MouvementStock[]) => {
                this.mouvements = ([...data]).sort((a: MouvementStock, b: MouvementStock) => new Date(b.dateMouvement).getTime() - new Date(a.dateMouvement).getTime());
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }

    enregistrerMouvement() {
        if (this.newMouvement.quantite <= 0) return;

        const produit = this.produits.find(p => p.idProduit === +this.newMouvement.produitId);
        if (this.newMouvement.typeMouvement === 'SORTIE' && produit && produit.quantiteStock < this.newMouvement.quantite) {
            alert(`Stock insuffisant ! Quantité disponible: ${produit.quantiteStock}`);
            return;
        }

        this.mouvementService.createMouvement(this.newMouvement).subscribe({
            next: () => {
                this.initialiserPage();
                this.newMouvement.motif = ''; // Reset motif
                this.newMouvement.quantite = 1; // Reset quantity
                alert('Mouvement enregistré !');
            },
            error: (err: any) => {
                const errorMsg = err.error?.message || err.message || 'Erreur lors de l\'enregistrement';
                alert('Erreur: ' + errorMsg);
                console.error('Erreur:', err);
            }
        });
    }

    getNomPiece(id: number | string | undefined): string {
        if (!id) return 'Produit inconnu';
        const p = this.produits.find(prod => prod.idProduit == id);
        if (p) {
            return p.designation || p.reference || ('Produit #' + id);
        }
        return 'Produit #' + id;
    }

    // Helper to resolve produit ID from backend response (which may return object or id)
    resolveProduitId(m: any): number | undefined {
        return m.produitId || m.produit?.idProduit;
    }

    supprimerMouvement(id: number | undefined) {
        if (!id || !confirm('Supprimer ce mouvement ?')) return;
        this.mouvementService.deleteMouvement(id).subscribe(() => this.initialiserPage());
    }
}

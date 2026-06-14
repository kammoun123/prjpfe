import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProduitService } from '../../Services/produit.service';
import { CategorieService } from '../../Services/categorie.service';
import { MouvementStockService } from '../../Services/mouvement-stock.service';
import { AuthService } from '../../Services/auth.service';
import { MouvementStock } from '../../models/mouvement-stock.model';
import { Produit } from '../../models/produit.model';
import { Utilisateur } from '../../models/utilisateur.model';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
    today = new Date();

    stats = {
        totalProducts: 0,
        totalCategories: 0,
        lowStockAlerts: 0,
        recentMovements: 0
    };

    recentMovements: MouvementStock[] = [];
    pendingUsers: Utilisateur[] = [];
    lowStockItems: Produit[] = [];
    loading: boolean = true;
    loadingUsers: boolean = true;

    constructor(
        private produitService: ProduitService,
        private categorieService: CategorieService,
        private mouvementService: MouvementStockService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadStats();
        this.loadPendingUsers();
    }

    loadStats(): void {
        this.loading = true;

        this.produitService.getPieces().subscribe({
            next: (produits: any[]) => {
                this.stats.totalProducts = produits.length;
                this.lowStockItems = produits.filter((p: any) => p.quantiteStock <= p.seuilAlerte);
                this.stats.lowStockAlerts = this.lowStockItems.length;
            },
            error: () => { }
        });

        this.categorieService.getCategories().subscribe({
            next: (cats: any[]) => this.stats.totalCategories = cats.length,
            error: () => { }
        });

        this.mouvementService.getAllMouvements().subscribe({
            next: (mvs: MouvementStock[]) => {
                this.stats.recentMovements = mvs.length;
                this.recentMovements = [...mvs].reverse().slice(0, 6);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadPendingUsers(): void {
        this.loadingUsers = true;
        this.authService.getUsers().subscribe({
            next: (users) => {
                this.pendingUsers = users.filter(u => u.statut === 'PENDING');
                this.loadingUsers = false;
            },
            error: () => { this.loadingUsers = false; }
        });
    }

    approveUser(user: Utilisateur): void {
        if (!user.idUtilisateur) return;
        this.authService.updateUserStatus(user.idUtilisateur, 'ACTIVE').subscribe({
            next: () => {
                this.loadPendingUsers();
            },
            error: (err) => console.error('Error approving user', err)
        });
    }

    getInitials(user: Utilisateur): string {
        return (user.nom[0] + user.prenom[0]).toUpperCase();
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduitService } from '../../Services/produit.service';
import { CategorieService } from '../../Services/categorie.service';
import { Produit } from '../../models/produit.model';
import { Categorie } from '../../models/categorie.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-product-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-management.component.html',
    styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
    produits: Produit[] = [];
    categories: Categorie[] = [];
    searchTerm: string = '';
    selectedCategory: number | null | undefined = null;
    showForm: boolean = false;
    formMode: 'add' | 'edit' = 'add';
    currentProduit: Produit = { reference: '', designation: '', quantiteStock: 0, seuilAlerte: 0, idCategorie: 0 };
    loading: boolean = false;
    success: string = '';
    error: string = '';

    // Photo
    selectedFile: File | null = null;
    photoPreview: string | null = null;
    selectedFiche: File | null = null;
    backendUrl = environment.apiUrl.replace('/api', '');

    constructor(
        private produitService: ProduitService,
        private categorieService: CategorieService
    ) { }

    ngOnInit(): void {
        this.fetchData();
    }

    get stats() {
        const totalItems = this.produits.length;
        const lowStockItems = this.produits.filter(p => p.quantiteStock <= (p.seuilAlerte ?? 0)).length;
        return {
            total: totalItems,
            lowStock: lowStockItems,
            lastUpdate: new Date().toLocaleDateString()
        };
    }

    fetchData(): void {
        this.loading = true;
        this.categorieService.getCategories().subscribe({
            next: (cats) => this.categories = cats,
            error: () => this.categories = []
        });
        this.produitService.getPieces().subscribe({
            next: (data) => { this.produits = data; this.loading = false; },
            error: (err) => { console.error('Erreur chargement produits', err); this.loading = false; }
        });
    }

    get filteredProduits() {
        return this.produits.filter(p => {
            const matchSearch =
                p.designation.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                p.reference.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchCat =
                this.selectedCategory == null || p.idCategorie === +this.selectedCategory;
            return matchSearch && matchCat;
        });
    }

    getCategoryName(id: number | undefined): string {
        const cat = this.categories.find(c => c.idCategorie === id);
        return cat ? cat.nomCategorie : 'Inconnue';
    }

    getStockPercent(produit: Produit): number {
        if (!produit.seuilAlerte || produit.seuilAlerte === 0) return 100;
        return Math.min(100, Math.round((produit.quantiteStock / (produit.seuilAlerte * 3)) * 100));
    }

    getPhotoUrl(produit: Produit): string {
        if (produit.photoUrl) {
            return this.backendUrl + encodeURI(produit.photoUrl);
        }
        return '';
    }

    openAddForm() {
        this.formMode = 'add';
        this.currentProduit = { reference: '', designation: '', quantiteStock: 0, seuilAlerte: 0, idCategorie: this.categories[0]?.idCategorie || 0, };
        this.selectedFile = null;
        this.selectedFiche = null;
        this.photoPreview = null;
        this.showForm = true;
        // Auto-generate reference for the default category
        if (this.categories.length > 0) {
            this.onCategoryChange();
        }
    }

    onCategoryChange() {
        if (this.formMode !== 'add') return;

        const selectedCat = this.categories.find(
            c => c.idCategorie != null && c.idCategorie === +(this.currentProduit.idCategorie ?? 0)
        );
        const catName: string | undefined = selectedCat?.nomCategorie;
        if (!catName) return;

        // Derive prefix from first 3 letters (uppercase), remove accents
        const prefix = catName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove accents (é→e, etc.)
            .replace(/[^a-zA-Z0-9]/g, '')    // keep alphanumeric only
            .substring(0, 3)
            .toUpperCase();

        // Find all existing references matching this prefix (e.g. MEC-xxx)
        const pattern = new RegExp(`^${prefix}-(\\d+)$`);
        const existingNumbers = this.produits
            .map(p => {
                const match = p.reference?.match(pattern);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => n > 0);

        const nextNumber = existingNumbers.length > 0
            ? Math.max(...existingNumbers) + 1
            : 1;

        // Pad to 3 digits: 1 → 001
        const paddedNumber = String(nextNumber).padStart(3, '0');
        this.currentProduit.reference = `${prefix}-${paddedNumber}`;
    }

    openEditForm(produit: Produit) {
        this.formMode = 'edit';
        this.currentProduit = { ...produit };
        this.selectedFile = null;
        this.selectedFiche = null;
        this.photoPreview = produit.photoUrl ? this.getPhotoUrl(produit) : null;
        this.showForm = true;
    }

    closeForm() {
        this.showForm = false;
        this.selectedFile = null;
        this.selectedFiche = null;
        this.photoPreview = null;
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.selectedFile = input.files[0];
            const reader = new FileReader();
            reader.onload = () => this.photoPreview = reader.result as string;
            reader.readAsDataURL(this.selectedFile);
        }
    }

    onFicheSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.selectedFiche = input.files[0];
        }
    }

    savePiece() {
        if (this.currentProduit.quantiteStock < 0) {
            this.error = 'La quantité en stock ne peut pas être négative';
            return;
        }
        if (this.currentProduit.seuilAlerte < 0) {
            this.error = 'Le seuil d\'alerte ne peut pas être négatif';
            return;
        }
        this.loading = true;
        if (this.formMode === 'add') {
            this.produitService.createProduit(this.currentProduit).subscribe({
                next: (created) => {
                    if (this.selectedFile) {
                        this.produitService.uploadPhoto(created.idProduit!, this.selectedFile).subscribe({
                            next: () => { this.uploadFicheIfSelected(created.idProduit!, 'Produit ajouté avec succès !'); },
                            error: () => { this.uploadFicheIfSelected(created.idProduit!, 'Produit ajouté (erreur photo)'); }
                        });
                    } else {
                        this.uploadFicheIfSelected(created.idProduit!, 'Produit ajouté avec succès !');
                    }
                },
                error: (err) => { this.error = 'Erreur lors de l\'ajout'; this.loading = false; console.error(err); }
            });
        } else {
            this.produitService.updateProduit(this.currentProduit.idProduit!, this.currentProduit).subscribe({
                next: (updated) => {
                    if (this.selectedFile) {
                        this.produitService.uploadPhoto(updated.idProduit!, this.selectedFile).subscribe({
                            next: () => { 
                                this.uploadFicheIfSelected(updated.idProduit!, 'Produit modifié avec succès !'); 
                            },
                            error: () => { 
                                this.uploadFicheIfSelected(updated.idProduit!, 'Produit modifié (erreur photo)'); 
                            }
                        });
                    } else {
                        this.uploadFicheIfSelected(updated.idProduit!, 'Produit modifié avec succès !');
                    }
                },
                error: (err) => { this.error = 'Erreur lors de la modification'; this.loading = false; console.error(err); }
            });
        }
    }

    private uploadFicheIfSelected(id: number, msg: string) {
        if (this.selectedFiche) {
            this.produitService.uploadFiche(id, this.selectedFiche).subscribe({
                next: () => this.onSaveSuccess(msg),
                error: () => this.onSaveSuccess(msg + ' (erreur fiche)')
            });
        } else {
            this.onSaveSuccess(msg);
        }
    }

    private onSaveSuccess(msg: string) {
        this.success = msg;
        this.showForm = false;
        this.selectedFile = null;
        this.selectedFiche = null;
        this.photoPreview = null;
        this.loading = false;
        this.fetchData();
        setTimeout(() => this.success = '', 3000);
    }

    deletePiece(id: number | undefined) {
        if (!id) return;
        if (confirm('Supprimer ce produit ?')) {
            this.produitService.deleteProduit(id).subscribe({
                next: () => {
                    this.success = 'Produit supprimé';
                    this.fetchData();
                    setTimeout(() => this.success = '', 3000);
                },
                error: () => this.error = 'Erreur lors de la suppression'
            });
        }
    }
}
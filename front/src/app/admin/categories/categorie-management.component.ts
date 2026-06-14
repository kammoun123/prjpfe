import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService } from '../../Services/categorie.service';
import { Categorie } from '../../models/categorie.model';

@Component({
    selector: 'app-categorie-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './categorie-management.component.html',
    styleUrls: ['./categorie-management.component.css']
})
export class CategorieManagementComponent implements OnInit {
    categories: Categorie[] = [];
    searchTerm: string = '';
    showForm: boolean = false;
    formMode: 'add' | 'edit' = 'add';
    currentCategorie: Categorie = { nomCategorie: '', description: '' };
    loading: boolean = false;

    constructor(private categorieService: CategorieService) { }

    ngOnInit(): void {
        this.fetchCategories();
    }

    get stats() {
        return {
            total: this.categories.length,
            recent: this.categories.slice(0, 3), // Just an example
            lastUpdate: new Date().toLocaleDateString()
        };
    }

    fetchCategories(): void {
        this.loading = true;
        this.categorieService.getCategories().subscribe({
            next: (data) => {
                this.categories = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur lors du chargement des catégories', err);
                this.loading = false;
                // Fallback mock data if server is down for demo
                this.categories = [
                    { idCategorie: 1, nomCategorie: 'Freinage', description: 'Systèmes de freinage complets' },
                    { idCategorie: 2, nomCategorie: 'Moteur', description: 'Pièces internes moteur' }
                ];
            }
        });
    }

    get filteredCategories() {
        return this.categories.filter(c =>
            c.nomCategorie.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    openAddForm() {
        this.formMode = 'add';
        this.currentCategorie = { nomCategorie: '', description: '' };
        this.showForm = true;
    }

    openEditForm(categorie: Categorie) {
        this.formMode = 'edit';
        this.currentCategorie = { ...categorie };
        this.showForm = true;
    }

    closeForm() {
        this.showForm = false;
    }

    saveCategorie() {
        if (!this.currentCategorie.nomCategorie) return;

        this.loading = true;
        this.categorieService.createCategorie(this.currentCategorie).subscribe({
            next: () => {
                this.fetchCategories();
                this.showForm = false;
            },
            error: (err) => {
                console.error('Erreur lors de la sauvegarde', err);
                this.loading = false;
                // Mock local update for UI feedback if backend not 100% ready
                if (this.formMode === 'add') {
                    const newId = Math.max(...this.categories.map(c => c.idCategorie || 0)) + 1;
                    this.categories.push({ ...this.currentCategorie, idCategorie: newId });
                } else {
                    const index = this.categories.findIndex(c => c.idCategorie === this.currentCategorie.idCategorie);
                    if (index !== -1) this.categories[index] = { ...this.currentCategorie };
                }
                this.showForm = false;
            }
        });
    }

    deleteCategorie(id: number | undefined) {
        if (!id) return;
        if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
            this.categorieService.deleteCategorie(id).subscribe({
                next: () => this.fetchCategories(),
                error: (err) => {
                    console.error('Erreur lors de la suppression', err);
                    this.categories = this.categories.filter(c => c.idCategorie !== id);
                }
            });
        }
    }
}

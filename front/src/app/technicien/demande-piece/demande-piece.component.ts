import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Produit as Piece } from '../../models/produit.model';
import { DemandeProduit } from '../../models/demande-produit.model';
import { PieceService } from '../../Services/piece.service';
import { DemandePieceService } from '../../Services/demande-piece.service';
import { CategorieService } from '../../Services/categorie.service';
import { Categorie } from '../../models/categorie.model';
import { ToastService } from '../../Services/toast.service';
import { NotificationService } from '../../Services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-demande-piece',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './demande-piece.component.html',
    styleUrls: ['./demande-piece.component.css']
})
export class DemandePieceComponent implements OnInit {
    pieces: Piece[] = [];
    allPieces: Piece[] = [];
    categories: Categorie[] = [];
    demandeForm!: FormGroup;
    loading = false;
    panier: { produitId: number; quantite: number; designation: string }[] = [];
    backendUrl = environment.apiUrl.replace('/api', '');

    constructor(
        private pieceService: PieceService,
        private demandeService: DemandePieceService,
        private categorieService: CategorieService,
        private fb: FormBuilder,
        private toastService: ToastService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.loadCategories();
        this.loadPieces();
        this.initForm();
    }

    loadCategories(): void {
        this.categorieService.getCategories().subscribe({
            next: (data) => this.categories = data,
            error: (err) => console.error('Erreur categories', err)
        });
    }

    loadPieces(): void {
        this.pieceService.getPieces().subscribe({
            next: (data) => {
                this.allPieces = data.filter(p => (p as any).statut === 'disponible' || p.quantiteStock > 0);
                this.pieces = [...this.allPieces];
            },
            error: (err) => {
                console.error('Erreur chargement pièces', err);
                this.toastService.show('Impossible de charger les pièces', 'error');
            }
        });
    }

    onCategorieChange(): void {
        const catId = this.demandeForm.get('categorie')?.value;
        if (catId) {
            this.pieces = this.allPieces.filter(p => p.idCategorie === catId);
        } else {
            this.pieces = [...this.allPieces];
        }
        this.demandeForm.patchValue({ piece: null });
    }

    initForm(): void {
        this.demandeForm = this.fb.group({
            categorie: [null],
            piece: [null, Validators.required],
            quantite: [1, [Validators.required, Validators.min(1)]],
            motif: [''],
            urgence: ['Normale'],
            technicienId: [1]
        });
    }

    ajouterAuPanier(): void {
        const formValue = this.demandeForm.value;
        if (!formValue.piece) {
            this.toastService.show('Sélectionnez une pièce d\'abord', 'warning');
            return;
        }

        const item = {
            produitId: formValue.piece.idProduit,
            quantite: formValue.quantite,
            designation: formValue.piece.designation
        };

        this.panier.push(item);
        this.toastService.show(`${item.designation} ajouté au panier`, 'success');

        this.demandeForm.patchValue({
            piece: null,
            quantite: 1
        });
    }

    retirerDuPanier(index: number): void {
        this.panier.splice(index, 1);
    }

    onSubmit(): void {
        if (this.panier.length === 0) {
            this.toastService.show('Votre panier est vide', 'error');
            return;
        }

        this.loading = true;
        const formValue = this.demandeForm.value;
        const requests: any[] = [];

        for (const item of this.panier) {
            const demande: DemandeProduit = {
                statut: 'En attente',
                produitId: item.produitId,
                quantite: item.quantite,
                motif: formValue.motif,
                technicienId: formValue.technicienId || 1,
                dateDemande: new Date()
            };
            requests.push(this.demandeService.createDemande(demande));
        }

        import('rxjs').then(({ forkJoin }) => {
            forkJoin(requests).subscribe({
                next: () => {
                    this.loading = false;

                    const itemsCount = this.panier.length;
                    this.notificationService.createNotification({
                        produitId: this.panier[0].produitId,
                        message: `Nouvelle demande de ${itemsCount} article(s) par Technicien #01`,
                        typeNotification: 'info',
                        dateCreation: new Date().toISOString(),
                        statut: 'NON_LUE',
                        roleCible: 'MAGASINIER'
                    }).subscribe();

                    this.toastService.show('Demande groupée créée avec succès !', 'success');
                    this.panier = [];
                    this.demandeForm.reset({
                        quantite: 1,
                        urgence: 'Normale',
                        technicienId: 1
                    });
                },
                error: (err) => {
                    this.loading = false;
                    this.toastService.show('Erreur lors de la création de la demande', 'error');
                    console.error(err);
                }
            });
        });
    }

    get f() { return this.demandeForm.controls; }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produit } from '../models/produit.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProduitService {
    private apiUrl = `${environment.apiUrl}/produits`;

    constructor(private http: HttpClient) { }

    getPieces(): Observable<Produit[]> {
        return this.http.get<Produit[]>(this.apiUrl);
    }

    createProduit(produit: Produit): Observable<Produit> {
        return this.http.post<Produit>(this.apiUrl, produit);
    }

    updateProduit(id: number, produit: Produit): Observable<Produit> {
        return this.http.put<Produit>(`${this.apiUrl}/${id}`, produit);
    }

    deleteProduit(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    uploadPhoto(id: number, file: File): Observable<{ photoUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ photoUrl: string }>(`${this.apiUrl}/${id}/photo`, formData);
    }

    uploadFiche(id: number, file: File): Observable<{ ficheTechniqueUrl: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ ficheTechniqueUrl: string }>(`${this.apiUrl}/${id}/fiche`, formData);
    }
}

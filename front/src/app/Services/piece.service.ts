import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produit as Piece } from '../models/produit.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PieceService {
    private apiUrl = `${environment.apiUrl}/produits`;

    constructor(private http: HttpClient) { }

    getPieces(): Observable<Piece[]> {
        return this.http.get<Piece[]>(this.apiUrl);
    }

    updatePiece(id: number, data: any): Observable<Piece> {
        return this.http.patch<Piece>(`${this.apiUrl}/${id}`, data);
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DemandeProduit } from '../models/demande-produit.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DemandePieceService {
    private demandesUrl = `${environment.apiUrl}/demandes`;

    constructor(private http: HttpClient) { }

    getDemandes(): Observable<DemandeProduit[]> {
        return this.http.get<DemandeProduit[]>(this.demandesUrl);
    }

    createDemande(demande: DemandeProduit): Observable<DemandeProduit> {
        return this.http.post<DemandeProduit>(this.demandesUrl, demande);
    }

    deleteDemande(id: number): Observable<any> {
        return this.http.delete(`${this.demandesUrl}/${id}`);
    }

    updateStatus(id: number, statut: string): Observable<DemandeProduit> {
        return this.http.patch<DemandeProduit>(`${this.demandesUrl}/${id}/statut`, { statut });
    }
}

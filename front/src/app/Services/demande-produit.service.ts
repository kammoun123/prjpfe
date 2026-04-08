import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DemandeProduit } from '../models/demande-produit.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DemandeProduitService {
  private apiUrl = `${environment.apiUrl}/demandes`;

  constructor(private http: HttpClient) { }

  getDemandes(): Observable<DemandeProduit[]> {
    return this.http.get<DemandeProduit[]>(this.apiUrl);
  }

  createDemande(demande: DemandeProduit): Observable<DemandeProduit> {
    return this.http.post<DemandeProduit>(this.apiUrl, demande);
  }

  deleteDemande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateStatutDemande(id: number, statut: string): Observable<DemandeProduit> {
    return this.http.patch<DemandeProduit>(`${this.apiUrl}/${id}/statut`, { statut });
  }
}

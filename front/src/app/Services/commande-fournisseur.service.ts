import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Commande {
  id?: number;
  idDemandeOrigine: number;
  produitId: number;
  fournisseurId: number;
  quantite: number;
  dateCommande?: string;
  dateReceptionPrevue?: string;
  statut: string;
  produit?: any;
  fournisseur?: any;
}

@Injectable({
  providedIn: 'root'
})
export class CommandeFournisseurService {
  private apiUrl = `${environment.apiUrl}/admin/commandes`;

  constructor(private http: HttpClient) { }

  getAllCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(this.apiUrl);
  }

  creerCommande(idDemande: number, idFournisseur: number, dateReceptionPrevue?: string): Observable<Commande> {
    return this.http.post<Commande>(this.apiUrl, { idDemande, idFournisseur, dateReceptionPrevue });
  }

  receptionnerCommande(id: number): Observable<Commande> {
    return this.http.put<Commande>(`${this.apiUrl}/${id}/receptionner`, {});
  }
}

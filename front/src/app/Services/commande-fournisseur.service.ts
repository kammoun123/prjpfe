import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CommandeLigne } from '../models/commande-ligne.model';
import { Fournisseur } from '../models/fournisseur.model';

export interface Commande {
  id?: number;
  idDemandeOrigine?: number;
  fournisseurId: number;
  dateCommande?: string;
  dateReceptionPrevue?: string;
  statut: string;
  observation?: string;
  fournisseur?: Fournisseur;
  lignes?: CommandeLigne[];
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

  creerCommande(idDemande: number, idFournisseur: number, dateReceptionPrevue?: string, observation?: string): Observable<Commande> {
    return this.http.post<Commande>(this.apiUrl, { idDemande, idFournisseur, dateReceptionPrevue, observation });
  }

  creerCommandeDirecte(items: { produitId: number | null, quantite: number }[], idFournisseur: number, dateReceptionPrevue?: string, observation?: string): Observable<Commande> {
    return this.http.post<Commande>(`${this.apiUrl}/directe`, { items, idFournisseur, dateReceptionPrevue, observation });
  }

  receptionnerCommande(id: number): Observable<Commande> {
    return this.http.put<Commande>(`${this.apiUrl}/${id}/receptionner`, {});
  }
}

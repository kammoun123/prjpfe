import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventaire } from '../models/inventaire.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventaireService {
  private inventairesUrl = `${environment.apiUrl}/inventaires`;

  constructor(private http: HttpClient) { }

  getInventaires(): Observable<Inventaire[]> {
    return this.http.get<Inventaire[]>(this.inventairesUrl);
  }

  addInventaire(inv: Inventaire): Observable<Inventaire> {
    return this.http.post<Inventaire>(this.inventairesUrl, inv);
  }

  updateInventaire(id: number | string, changes: Partial<Inventaire>): Observable<Inventaire> {
    return this.http.put<Inventaire>(`${this.inventairesUrl}/${id}`, changes);
  }

  deleteInventaire(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.inventairesUrl}/${id}`);
  }
}

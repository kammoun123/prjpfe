import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MouvementStock } from '../models/mouvement-stock.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MouvementStockService {
    private mouvementsUrl = `${environment.apiUrl}/mouvements`;

    constructor(private http: HttpClient) { }

    getAllMouvements(): Observable<MouvementStock[]> {
        return this.http.get<MouvementStock[]>(this.mouvementsUrl);
    }

    createMouvement(mouvement: any): Observable<any> {
        return this.http.post<any>(this.mouvementsUrl, mouvement);
    }

    deleteMouvement(id: number): Observable<any> {
        return this.http.delete<any>(`${this.mouvementsUrl}/${id}`);
    }
}


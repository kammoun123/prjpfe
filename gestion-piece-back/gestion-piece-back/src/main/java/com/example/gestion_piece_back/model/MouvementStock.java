package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "mouvements_stock")
public class MouvementStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    private Produit produit;

    @Column(name = "type_mouvement")
    private String typeMouvement; // "ENTREE" ou "SORTIE"

    @Column(name = "quantite")
    private Integer quantite;

    @Column(name = "date_mouvement")
    private LocalDateTime dateMouvement;

    @Column(name = "motif")
    private String motif;

    @PrePersist
    protected void onCreate() {
        dateMouvement = LocalDateTime.now();
    }
}

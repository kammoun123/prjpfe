package com.example.gestion_piece_back.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "produit_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({"categorie", "qrCode", "ficheTechniqueUrl"})
    private Produit produit;

    // Used by frontend to send the produit ID
    @Column(name = "produit_id")
    private Long produitId;

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
        if (dateMouvement == null) {
            dateMouvement = LocalDateTime.now();
        }
    }
}

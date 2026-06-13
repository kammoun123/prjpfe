package com.example.gestion_piece_back.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "demandes_pieces_lignes")
@Data
@NoArgsConstructor
public class DemandePieceLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    @JsonBackReference
    private DemandeProduit demande;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Produit produit;

    @Column(name = "produit_id", insertable = false, updatable = false)
    private Long produitId;

    @Column(name = "quantite")
    private Integer quantite;

    @Column(name = "motif")
    private String motif;

    @Column(name = "statut")
    private String statut; // "EN_ATTENTE", "APPROUVEE", "REJETEE"

    @Column(name = "observation")
    private String observation;
}

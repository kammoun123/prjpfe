package com.example.gestion_piece_back.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "commandes_lignes")
@Data
@NoArgsConstructor
public class CommandeLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commande_id", nullable = false)
    @JsonBackReference
    private Commande commande;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Produit produit;

    @Column(name = "produit_id", insertable = false, updatable = false)
    private Long produitId;

    @Column(name = "quantite")
    private Integer quantite;

    @Column(name = "statut")
    private String statut; // "EN_COURS", "LIVREE", "PARTIELLEMENT_LIVREE"

    @Column(name = "observation")
    private String observation;
}

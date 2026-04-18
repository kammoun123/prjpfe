package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "fournisseurs")
public class Fournisseur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long idFournisseur;

    @Column(name = "nom")
    private String nom;

    @Column(name = "email")
    private String email;

    @Column(name = "telephone")
    private String telephone;

    @Column(name = "adresse")
    private String adresse;

    @Column(name = "statut")
    private String statut; // "ACTIF" ou "INACTIF"
}

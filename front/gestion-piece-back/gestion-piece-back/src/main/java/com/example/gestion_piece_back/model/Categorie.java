package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "categories")
public class Categorie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long idCategorie;

    @Column(name = "nom_categorie")
    private String nomCategorie;

    @Column(name = "description")
    private String description;
}
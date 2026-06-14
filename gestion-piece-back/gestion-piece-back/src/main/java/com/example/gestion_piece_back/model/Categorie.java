package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Data
@NoArgsConstructor
@Table(name = "categories")
public class Categorie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("idCategorie")
    private Long id;

    @Column(name = "nom_categorie", unique = true, nullable = false)
    private String nomCategorie;

    @Column(name = "description")
    private String description;
}

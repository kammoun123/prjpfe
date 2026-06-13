package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "demande_inscription")
public class DemandeInscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;
    private String email;
    private String motDePasse;
    private String role;
    private LocalDateTime dateDemande;

    @PrePersist
    protected void onCreate() {
        dateDemande = LocalDateTime.now();
    }
}

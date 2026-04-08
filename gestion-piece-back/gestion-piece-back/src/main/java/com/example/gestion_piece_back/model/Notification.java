package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long idNotification;

    @Column(name = "titre")
    private String titre;

    @Column(name = "produit_id")
    private Long produitId;

    @Column(name = "message")
    private String message;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "statut")
    private String statut; // "NON_LUE" ou "LUE"

    @Column(name = "type_notification")
    private String typeNotification; // "ALERTE_STOCK", "MOUVEMENT", etc.

    @Column(name = "role_cible")
    private String roleCible; // "ADMIN", "CONTROLEUR", etc.

    @Column(name = "data", columnDefinition = "TEXT")
    private String data; // Contenu JSON additionnel

    @ManyToOne
    @JoinColumn(name = "produit_id", insertable = false, updatable = false)
    private Produit produit;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (statut == null) {
            statut = "NON_LUE";
        }
    }
}

package com.example.gestion_piece_back.service;

import com.example.gestion_piece_back.model.*;
import com.example.gestion_piece_back.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventaireService {

    @Autowired
    private InventaireRepository inventaireRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private MouvementStockService mouvementStockService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public List<Inventaire> getAllInventaires() {
        List<Inventaire> inventaires = inventaireRepository.findAll();
        // Initialize lazy collection to avoid LazyInitializationException
        inventaires.forEach(i -> i.getLignes().size());
        return inventaires;
    }

    @Transactional(readOnly = true)
    public Inventaire getInventaireById(Long id) {
        Inventaire inventaire = inventaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventaire non trouvé"));
        // Initialize lazy collection to avoid LazyInitializationException
        inventaire.getLignes().size();
        return inventaire;
    }

    @Transactional
    public Inventaire createInventaire(Inventaire inventaire) {
        if (inventaire.getDateDebut() == null) {
            inventaire.setDateDebut(LocalDateTime.now());
        }

        // Match front-end expectations or force status if sent
        boolean isSent = "Validé".equalsIgnoreCase(inventaire.getStatut());

        if (inventaire.getStatut() == null) {
            inventaire.setStatut("En cours");
        }

        // Si aucune ligne n'est fournie, on initialise avec tous les produits actuels
        if (inventaire.getLignes() == null || inventaire.getLignes().isEmpty()) {
            List<Produit> produits = produitRepository.findAll();
            List<LigneInventaire> lignes = produits.stream().map(p -> {
                LigneInventaire ligne = new LigneInventaire();
                ligne.setInventaire(inventaire);
                ligne.setProduit(p);
                ligne.setQuantiteTheorique(p.getQuantiteStock());
                ligne.setQuantiteReelle(p.getQuantiteStock()); // Par défaut, identique
                ligne.setEcart(0);
                return ligne;
            }).collect(Collectors.toList());
            inventaire.setLignes(lignes);
        } else {
            inventaire.getLignes().forEach(l -> {
                l.setInventaire(inventaire);
                if (l.getQuantiteTheorique() != null && l.getQuantiteReelle() != null) {
                    l.setEcart(l.getQuantiteReelle() - l.getQuantiteTheorique());
                } else {
                    l.setEcart(0);
                }
            });
        }

        Inventaire saved = inventaireRepository.save(inventaire);

        if ("Validé".equalsIgnoreCase(saved.getStatut()) || "VALIDATED".equalsIgnoreCase(saved.getStatut())) {
            saved.setDateFin(LocalDateTime.now());
            updateStocksFromInventaire(saved);
            sendAuditNotifications(saved);
        }

        return saved;
    }

    @Transactional
    public Inventaire updateInventaire(Long id, Inventaire details) {
        Inventaire inventaire = getInventaireById(id);

        if (details.getStatut() != null) {
            String oldStatus = inventaire.getStatut();
            inventaire.setStatut(details.getStatut());

            // Si on valide, on met à jour les stocks réels
            if ("Validé".equalsIgnoreCase(details.getStatut()) && !"Validé".equalsIgnoreCase(oldStatus)) {
                inventaire.setDateFin(LocalDateTime.now());
                updateStocksFromInventaire(inventaire);
                sendAuditNotifications(inventaire);
            } else if ("Refusé".equalsIgnoreCase(details.getStatut())
                    || "Annulé".equalsIgnoreCase(details.getStatut())) {
                inventaire.setDateFin(LocalDateTime.now());
            }
        }

        if (details.getDateFin() != null) {
            inventaire.setDateFin(details.getDateFin());
        }

        if (details.getLignes() != null && !details.getLignes().isEmpty()) {
            for (LigneInventaire detailsLigne : details.getLignes()) {
                inventaire.getLignes().stream()
                        .filter(l -> l.getId() != null && l.getId().equals(detailsLigne.getId()))
                        .findFirst()
                        .ifPresent(l -> {
                            if (detailsLigne.getQuantiteReelle() != null) {
                                l.setQuantiteReelle(detailsLigne.getQuantiteReelle());
                                l.setEcart(l.getQuantiteReelle()
                                        - (l.getQuantiteTheorique() != null ? l.getQuantiteTheorique() : 0));
                            }
                            if (detailsLigne.getObservation() != null) {
                                l.setObservation(detailsLigne.getObservation());
                            }
                        });
            }
        }

        return inventaireRepository.save(inventaire);
    }

    public void deleteInventaire(Long id) {
        inventaireRepository.deleteById(id);
    }

    private void updateStocksFromInventaire(Inventaire inventaire) {
        for (LigneInventaire ligne : inventaire.getLignes()) {
            Produit produit = ligne.getProduit();
            if (produit != null && ligne.getEcart() != 0) {
                // Record movement for traceability
                MouvementStock mouvement = new MouvementStock();
                mouvement.setProduit(produit);
                mouvement.setQuantite(Math.abs(ligne.getEcart()));
                mouvement.setTypeMouvement(ligne.getEcart() > 0 ? "ENTREE" : "SORTIE");
                mouvement.setMotif("Ajustement par Audit #" + inventaire.getId() +
                        (ligne.getObservation() != null ? " - " + ligne.getObservation() : ""));
                mouvement.setDateMouvement(LocalDateTime.now());
                mouvementStockService.createMouvement(mouvement); // This also updates current stock

                // Note: mouvementStockService.createMouvement already updates the produit's
                // quantiteStock
            } else if (produit != null && ligne.getEcart() == 0) {
                // Even if no gap, we ensure it's synced if theoretically it was different
                produit.setQuantiteStock(ligne.getQuantiteReelle());
                produitRepository.save(produit);
            }
        }
    }

    private void sendAuditNotifications(Inventaire inventaire) {
        // Notification for Admin
        Notification notifAdmin = new Notification();
        notifAdmin.setTitre("Audit de stock terminé");
        notifAdmin.setMessage("L'audit #" + inventaire.getId()
                + " a été validé par le contrôleur. Les écarts de stock ont été régularisés.");
        notifAdmin.setRoleCible("ADMIN");
        notifAdmin.setTypeNotification("SUCCESS");
        notifAdmin.setDateCreation(LocalDateTime.now());
        notificationRepository.save(notifAdmin);

        // Notification for Magasinier
        Notification notifMag = new Notification();
        notifMag.setTitre("Régularisation de stock");
        notifMag.setMessage("Le stock a été mis à jour suite à l'audit #" + inventaire.getId()
                + ". Veuillez consulter les historiques.");
        notifMag.setRoleCible("MAGASINIER");
        notifMag.setTypeNotification("info");
        notifMag.setDateCreation(LocalDateTime.now());
        notificationRepository.save(notifMag);
    }
}

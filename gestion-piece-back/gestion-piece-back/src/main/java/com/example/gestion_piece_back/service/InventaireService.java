package com.example.gestion_piece_back.service;

import com.example.gestion_piece_back.model.Inventaire;
import com.example.gestion_piece_back.model.LigneInventaire;
import com.example.gestion_piece_back.model.Produit;
import com.example.gestion_piece_back.repository.InventaireRepository;
import com.example.gestion_piece_back.repository.ProduitRepository;
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

    public List<Inventaire> getAllInventaires() {
        return inventaireRepository.findAll();
    }

    public Inventaire getInventaireById(Long id) {
        return inventaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventaire non trouvé"));
    }

    @Transactional
    public Inventaire createInventaire(Inventaire inventaire) {
        if (inventaire.getDateDebut() == null) {
            inventaire.setDateDebut(LocalDateTime.now());
        }
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
            // S'assurer que le lien bidirectionnel est correct
            inventaire.getLignes().forEach(l -> l.setInventaire(inventaire));
        }

        return inventaireRepository.save(inventaire);
    }

    @Transactional
    public Inventaire updateInventaire(Long id, Inventaire details) {
        Inventaire inventaire = getInventaireById(id);
        
        if (details.getStatut() != null) {
            String oldStatus = inventaire.getStatut();
            inventaire.setStatut(details.getStatut());
            
            // Si on valide, on met à jour les stocks réels
            if ("Validé".equals(details.getStatut()) && !"Validé".equals(oldStatus)) {
                inventaire.setDateFin(LocalDateTime.now());
                updateStocksFromInventaire(inventaire);
            } else if ("Refusé".equals(details.getStatut()) || "Annulé".equals(details.getStatut())) {
                inventaire.setDateFin(LocalDateTime.now());
            }
        }

        if (details.getDateFin() != null) {
            inventaire.setDateFin(details.getDateFin());
        }

        // Mise à jour des lignes si fournies
        if (details.getLignes() != null && !details.getLignes().isEmpty()) {
            // Logique simplifiée: on remplace ou on met à jour
            // Pour ce MVP, on met à jour les quantités réelles et écarts
            for (LigneInventaire detailsLigne : details.getLignes()) {
                inventaire.getLignes().stream()
                    .filter(l -> l.getId() != null && l.getId().equals(detailsLigne.getId()))
                    .findFirst()
                    .ifPresent(l -> {
                        l.setQuantiteReelle(detailsLigne.getQuantiteReelle());
                        l.setEcart(l.getQuantiteReelle() - l.getQuantiteTheorique());
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
            if (produit != null) {
                produit.setQuantiteStock(ligne.getQuantiteReelle());
                produitRepository.save(produit);
            }
        }
    }
}

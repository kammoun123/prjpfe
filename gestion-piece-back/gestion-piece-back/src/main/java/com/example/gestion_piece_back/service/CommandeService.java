package com.example.gestion_piece_back.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.gestion_piece_back.model.*;
import com.example.gestion_piece_back.repository.*;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommandeService {

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private DemandeProduitRepository demandeRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private MouvementStockService mouvementStockService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    public List<Commande> getAllCommandes() {
        return commandeRepository.findAll();
    }

    @Transactional
    public Commande creerCommande(Long idDemande, Long idFournisseur, java.time.LocalDate datePrev) {
        DemandeProduit demande = demandeRepository.findById(idDemande)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        // 1. Créer l'entité Commande (US 14.5)
        Commande commande = new Commande();
        commande.setIdDemandeOrigine(idDemande);
        commande.setProduitId(demande.getProduitId());
        commande.setFournisseurId(idFournisseur);
        commande.setQuantite(demande.getQuantite());
        commande.setDateCommande(LocalDateTime.now());
        commande.setDateReceptionPrevue(datePrev);
        commande.setStatut("EN_COURS");

        // 2. Mettre à jour la demande vers COMMANDEE (US 14.6)
        demande.setStatut("COMMANDEE");
        demandeRepository.save(demande);

        // 3. Envoyer Email au fournisseur (Optionnel mais recommandé pour le réalisme)
        try {
            // Logique simulée d'envoi d'email
            System.out.println("Envoi email de commande au fournisseur ID: " + idFournisseur);
        } catch (Exception e) {
            System.err.println("Erreur email: " + e.getMessage());
        }

        return commandeRepository.save(commande);
    }

    @Transactional
    public Commande receptionnerCommande(Long idCommande) {
        Commande commande = commandeRepository.findById(idCommande)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée"));

        if ("LIVREE".equals(commande.getStatut())) {
            throw new RuntimeException("Commande déjà réceptionnée");
        }

        // 1. Incrémenter le stock (US 14.9)
        Produit produit = produitRepository.findById(commande.getProduitId())
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
        produit.setQuantiteStock(produit.getQuantiteStock() + commande.getQuantite());
        produitRepository.save(produit);

        // 2. Créer mouvement de stock ENTREE (US 14.10)
        MouvementStock mouvement = new MouvementStock();
        mouvement.setProduitId(commande.getProduitId());
        mouvement.setQuantite(commande.getQuantite());
        mouvement.setTypeMouvement("ENTREE");
        mouvement.setMotif("Réception commande fournisseur #" + commande.getId());
        mouvement.setDateMouvement(LocalDateTime.now());
        mouvementStockService.createMouvement(mouvement);

        // 3. Mettre à jour les statuts (US 14.11 & 14.12)
        commande.setStatut("LIVREE");
        
        DemandeProduit demande = demandeRepository.findById(commande.getIdDemandeOrigine()).orElse(null);
        if (demande != null) {
            demande.setStatut("TRAITEE");
            demandeRepository.save(demande);
        }

        // 4. Notification au magasinier (US 14.13)
        Notification notification = new Notification();
        notification.setProduitId(commande.getProduitId());
        notification.setMessage("La commande fournisseur pour " + produit.getDesignation() + " a été réceptionnée. Le stock est à jour.");
        notification.setTypeNotification("SUCCESS");
        notification.setRoleCible("MAGASINIER");
        notification.setStatut("NON_LUE");
        notification.setDateCreation(LocalDateTime.now());
        notificationService.saveNotification(notification);

        return commandeRepository.save(commande);
    }
}

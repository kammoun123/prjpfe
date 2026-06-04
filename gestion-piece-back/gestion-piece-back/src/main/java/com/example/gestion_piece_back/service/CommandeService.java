package com.example.gestion_piece_back.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.gestion_piece_back.model.*;
import com.example.gestion_piece_back.repository.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    @Autowired
    private FournisseurRepository fournisseurRepository;

    public List<Commande> getAllCommandes() {
        return commandeRepository.findAll();
    }

    @Transactional
    public Commande creerCommande(Long idDemande, Long idFournisseur, java.time.LocalDate datePrev,
            String observation) {
        DemandeProduit demande = demandeRepository.findById(idDemande)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        // 1. Créer l'entité Commande (US 14.5)
        Commande commande = new Commande();
        commande.setIdDemandeOrigine(idDemande);
        commande.setFournisseurId(idFournisseur);
        commande.setDateCommande(LocalDateTime.now());
        commande.setDateReceptionPrevue(datePrev);
        commande.setStatut("EN_COURS");

        // Copy lignes from demand to command
        if (demande.getLignes() != null && !demande.getLignes().isEmpty()) {
            List<CommandeLigne> commandeLignes = new ArrayList<>();
            for (DemandePieceLigne demandeLigne : demande.getLignes()) {
                CommandeLigne cmdLigne = new CommandeLigne();
                cmdLigne.setCommande(commande);
                cmdLigne.setProduitId(demandeLigne.getProduitId());
                if (demandeLigne.getProduitId() != null) {
                    Produit p = produitRepository.findById(demandeLigne.getProduitId()).orElse(null);
                    cmdLigne.setProduit(p);
                }
                cmdLigne.setQuantite(demandeLigne.getQuantite());
                cmdLigne.setStatut("EN_COURS");
                commandeLignes.add(cmdLigne);
            }
            commande.setLignes(commandeLignes);
        }

        // 2. Mettre à jour la demande vers COMMANDEE (US 14.6)
        demande.setStatut("COMMANDEE");
        demandeRepository.save(demande);

        // 3. Envoyer Email au fournisseur
        try {
            Fournisseur f = fournisseurRepository.findById(idFournisseur).orElse(null);
            if (f != null && f.getEmail() != null) {
                emailService.sendOrderEmailMulti(f.getEmail(), f.getNom(), commande.getLignes(), observation, datePrev);
            }
        } catch (Exception e) {
            System.err.println("Erreur email: " + e.getMessage());
        }

        return commandeRepository.save(commande);
    }

    @Transactional
    public Commande creerCommandeDirecte(List<Map<String, Object>> items, Long idFournisseur,
            java.time.LocalDate datePrev, String observation) {
        Commande commande = new Commande();
        commande.setFournisseurId(idFournisseur);
        commande.setDateCommande(LocalDateTime.now());
        commande.setDateReceptionPrevue(datePrev);
        commande.setStatut("EN_COURS");
        commande.setObservation(observation);

        List<CommandeLigne> commandeLignes = new ArrayList<>();
        for (Map<String, Object> item : items) {
            Long idProduit = Long.valueOf(item.get("produitId").toString());
            int quantite = Integer.parseInt(item.get("quantite").toString());

            CommandeLigne cmdLigne = new CommandeLigne();
            cmdLigne.setCommande(commande);
            cmdLigne.setProduitId(idProduit);
            if (idProduit != null) {
                Produit p = produitRepository.findById(idProduit).orElse(null);
                cmdLigne.setProduit(p);
            }
            cmdLigne.setQuantite(quantite);
            cmdLigne.setStatut("EN_COURS");
            commandeLignes.add(cmdLigne);
        }

        commande.setLignes(commandeLignes);

        // Envoyer Email au fournisseur
        try {
            Fournisseur f = fournisseurRepository.findById(idFournisseur).orElse(null);
            if (f != null && f.getEmail() != null) {
                emailService.sendOrderEmailMulti(f.getEmail(), f.getNom(), commande.getLignes(), observation, datePrev);
            }
        } catch (Exception e) {
            System.err.println("Erreur email directe: " + e.getMessage());
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

        // Process each ligne in the command
        if (commande.getLignes() != null) {
            for (CommandeLigne ligne : commande.getLignes()) {
                // Créer mouvement de stock ENTREE (US 14.10)
                // L'incrémentation de la quantité en stock se fait automatiquement à
                // l'intérieur de createMouvement("ENTREE")
                MouvementStock mouvement = new MouvementStock();
                mouvement.setProduitId(ligne.getProduitId());
                mouvement.setQuantite(ligne.getQuantite());
                mouvement.setTypeMouvement("ENTREE");
                mouvement.setMotif("Réception commande #" + commande.getId());
                mouvement.setDateMouvement(LocalDateTime.now());
                mouvementStockService.createMouvement(mouvement);

                // Update ligne status
                ligne.setStatut("LIVREE");
            }
        }

        // 3. Mettre à jour les statuts (US 14.11 & 14.12)
        commande.setStatut("LIVREE");

        if (commande.getIdDemandeOrigine() != null) {
            DemandeProduit demande = demandeRepository.findById(commande.getIdDemandeOrigine()).orElse(null);
            if (demande != null) {
                demande.setStatut("TRAITEE");
                demandeRepository.save(demande);
            }
        }

        // 4. Notification au magasinier (US 14.13)
        String productsInfo = "";
        if (commande.getLignes() != null && !commande.getLignes().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (CommandeLigne ligne : commande.getLignes()) {
                if (sb.length() > 0)
                    sb.append(", ");
                Produit p = produitRepository.findById(ligne.getProduitId()).orElse(null);
                sb.append(p != null ? p.getDesignation() : "Produit #" + ligne.getProduitId());
            }
            productsInfo = sb.toString();
        }

        Notification notification = new Notification();
        if (commande.getLignes() != null && !commande.getLignes().isEmpty()) {
            notification.setProduitId(commande.getLignes().get(0).getProduitId());
        }
        notification.setMessage(
                "La commande pour " + productsInfo + " a été réceptionnée. Le stock est à jour.");
        notification.setTypeNotification("SUCCESS");
        notification.setRoleCible("MAGASINIER");
        notification.setStatut("NON_LUE");
        notification.setDateCreation(LocalDateTime.now());
        notificationService.saveNotification(notification);

        return commandeRepository.save(commande);
    }
}

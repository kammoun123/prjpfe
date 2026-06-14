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

    @Transactional(readOnly = true)
    public List<Commande> getAllCommandes() {
        List<Commande> commandes = commandeRepository.findAll();
        // Initialize lazy collections to avoid LazyInitializationException
        commandes.forEach(c -> {
            c.getLignes().size();
            if (c.getFournisseur() != null) {
                c.getFournisseur().getNom();
            }
        });
        return commandes;
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
                if (demandeLigne.getProduitId() != null) {
                    Produit p = produitRepository.findById(demandeLigne.getProduitId()).orElse(null);
                    cmdLigne.setProduit(p); // Set the entity – this writes to the produit_id FK column
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

        // 4. Notification au magasinier que la commande a été passée
        Notification notifMagasinier = new Notification();
        if (commande.getLignes() != null && !commande.getLignes().isEmpty()) {
            CommandeLigne firstLigne = commande.getLignes().get(0);
            Long firstPid = firstLigne.getProduitId();
            if (firstPid == null && firstLigne.getProduit() != null)
                firstPid = firstLigne.getProduit().getIdProduit();
            notifMagasinier.setProduitId(firstPid);
        }
        notifMagasinier.setMessage(
                "La commande fournisseur pour la demande #" + idDemande + " a été passée ! En attente de livraison.");
        notifMagasinier.setTypeNotification("info");
        notifMagasinier.setRoleCible("MAGASINIER");
        notifMagasinier.setStatut("NON_LUE");
        notifMagasinier.setDateCreation(LocalDateTime.now());
        notificationService.saveNotification(notifMagasinier);

        Commande savedCommande = commandeRepository.save(commande);

        // Add history trace for each line
        // Removed as per user request: orders should not appear in movements until received.

        // Initialize lazy properties
        if (savedCommande.getLignes() != null) {
            savedCommande.getLignes().size();
        }
        if (savedCommande.getFournisseur() != null) {
            savedCommande.getFournisseur().getNom();
        }

        return savedCommande;
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
            if (idProduit != null) {
                Produit p = produitRepository.findById(idProduit).orElse(null);
                cmdLigne.setProduit(p); // Set the entity – this writes to the produit_id FK column
            }
            cmdLigne.setQuantite(quantite);
            cmdLigne.setStatut("EN_COURS");
            commandeLignes.add(cmdLigne);
        }

        commande.setLignes(commandeLignes);

        Commande savedCommande = commandeRepository.save(commande);

        // Envoyer Email au fournisseur
        try {
            Fournisseur f = fournisseurRepository.findById(idFournisseur).orElse(null);
            if (f != null && f.getEmail() != null) {
                emailService.sendOrderEmailMulti(f.getEmail(), f.getNom(), savedCommande.getLignes(), observation,
                        datePrev);
            }
        } catch (Exception e) {
            System.err.println("Erreur email directe: " + e.getMessage());
        }

        // Add history trace for each line
        // Removed as per user request: orders should not appear in movements until received.

        // Initialize lazy properties
        if (savedCommande.getLignes() != null) {
            savedCommande.getLignes().size();
        }
        if (savedCommande.getFournisseur() != null) {
            savedCommande.getFournisseur().getNom();
        }

        return savedCommande;
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
                // Resolve produit ID safely (column is read-only from FK)
                Long produitId = ligne.getProduitId();
                if (produitId == null && ligne.getProduit() != null) {
                    produitId = ligne.getProduit().getIdProduit();
                }
                if (produitId == null) {
                    System.err.println("Ligne #" + ligne.getId() + " n'a pas de produit associé, ignorée.");
                    continue;
                }

                Produit p = ligne.getProduit();
                if (p == null) {
                    p = produitRepository.findById(produitId).orElse(null);
                }
                if (p != null) {
                    MouvementStock mouvement = new MouvementStock();
                    mouvement.setProduit(p);
                    mouvement.setQuantite(ligne.getQuantite());
                    mouvement.setTypeMouvement("ENTREE");
                    mouvement.setMotif("Réception commande #" + commande.getId());
                    mouvement.setDateMouvement(LocalDateTime.now());
                    mouvementStockService.createMouvement(mouvement);
                }

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
                Long pid = ligne.getProduitId();
                if (pid == null && ligne.getProduit() != null)
                    pid = ligne.getProduit().getIdProduit();
                if (pid == null)
                    continue;

                if (sb.length() > 0)
                    sb.append(", ");
                Produit p = produitRepository.findById(pid).orElse(null);
                sb.append(p != null ? p.getDesignation() : "Produit #" + pid);
            }
            productsInfo = sb.toString();
        }

        Notification notification = new Notification();
        if (commande.getLignes() != null && !commande.getLignes().isEmpty()) {
            CommandeLigne firstLigne = commande.getLignes().get(0);
            Long firstPid = firstLigne.getProduitId();
            if (firstPid == null && firstLigne.getProduit() != null)
                firstPid = firstLigne.getProduit().getIdProduit();
            notification.setProduitId(firstPid);
        }
        notification.setMessage(
                "La commande pour " + productsInfo + " a été réceptionnée. Le stock est à jour.");
        notification.setTypeNotification("SUCCESS");
        notification.setRoleCible("MAGASINIER");
        notification.setStatut("NON_LUE");
        notification.setDateCreation(LocalDateTime.now());
        notificationService.saveNotification(notification);

        Commande saved = commandeRepository.save(commande);
        
        // Initialize lazy properties
        saved.getLignes().size();
        if (saved.getFournisseur() != null) {
            saved.getFournisseur().getNom();
        }
        
        return saved;
    }
}

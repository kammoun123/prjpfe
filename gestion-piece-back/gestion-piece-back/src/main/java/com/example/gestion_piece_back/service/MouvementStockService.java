package com.example.gestion_piece_back.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.gestion_piece_back.model.MouvementStock;
import com.example.gestion_piece_back.model.Produit;
import com.example.gestion_piece_back.model.Notification;
import com.example.gestion_piece_back.repository.MouvementStockRepository;
import com.example.gestion_piece_back.repository.ProduitRepository;
import com.example.gestion_piece_back.repository.NotificationRepository;
import com.example.gestion_piece_back.repository.UtilisateurRepository;
import com.example.gestion_piece_back.service.EmailService;
import com.example.gestion_piece_back.model.Utilisateur;
import java.util.List;

@Service
public class MouvementStockService {

    @Autowired
    private MouvementStockRepository mouvementStockRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private EmailService emailService;

    public List<MouvementStock> getAllMouvements() {
        return mouvementStockRepository.findAll();
    }

    public List<MouvementStock> getMouvementsByProduit(Long produitId) {
        return mouvementStockRepository.findByProduitId(produitId);
    }

    public MouvementStock createMouvement(MouvementStock mouvement) {
        // Resolve produit from produitId if produit object is not set
        Long pid = mouvement.getProduitId();
        if (pid == null && mouvement.getProduit() != null) {
            pid = mouvement.getProduit().getIdProduit();
            mouvement.setProduitId(pid);
        }

        MouvementStock saved = mouvementStockRepository.save(mouvement);

        // Mettre à jour la quantité en stock
        if (pid != null) {
            Produit produit = produitRepository.findById(pid).orElse(null);
            if (produit != null) {
                int newQuantite = produit.getQuantiteStock() != null ? produit.getQuantiteStock() : 0;
                if ("ENTREE".equals(mouvement.getTypeMouvement())) {
                    newQuantite += mouvement.getQuantite();
                } else if ("SORTIE".equals(mouvement.getTypeMouvement())) {
                    if (produit.getQuantiteStock() != null && produit.getQuantiteStock() < mouvement.getQuantite()) {
                        throw new RuntimeException("Stock insuffisant pour effectuer cette sortie. Stock actuel: "
                                + produit.getQuantiteStock());
                    }
                    newQuantite -= mouvement.getQuantite();
                }
                produit.setQuantiteStock(newQuantite);
                produitRepository.save(produit);

                // Vérifier si le seuil d'alerte est atteint
                int seuilAlerte = produit.getSeuilAlerte() != null ? produit.getSeuilAlerte() : 0;
                if (newQuantite <= seuilAlerte) {
                    createAlertNotification(produit);
                }
            }
        }

        return saved;
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteMouvement(Long id) {
        MouvementStock mouvement = mouvementStockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mouvement non trouvé"));

        // Reverse stock level before deleting
        Long pid = mouvement.getProduitId();
        if (pid == null && mouvement.getProduit() != null) {
            pid = mouvement.getProduit().getIdProduit();
        }
        if (pid != null) {
            Produit produit = produitRepository.findById(pid).orElse(null);
            if (produit != null) {
                int newQuantite = produit.getQuantiteStock();
                if ("ENTREE".equals(mouvement.getTypeMouvement())) {
                    newQuantite -= mouvement.getQuantite();
                } else if ("SORTIE".equals(mouvement.getTypeMouvement())) {
                    newQuantite += mouvement.getQuantite();
                }

                // Prevent negative stock result
                if (newQuantite < 0)
                    newQuantite = 0;

                produit.setQuantiteStock(newQuantite);
                produitRepository.save(produit);
            }
        }

        mouvementStockRepository.delete(mouvement);
    }

    private void createAlertNotification(Produit produit) {
        // Vérifier si une notification d'alerte existe déjà
        List<Notification> existingAlerts = notificationRepository.findByProduitId(produit.getIdProduit());
        boolean alertExists = existingAlerts.stream()
                .anyMatch(n -> "NON_LUE".equals(n.getStatut()) && "ALERTE_STOCK".equals(n.getTypeNotification()));

        if (!alertExists) {
            Notification notification = new Notification();
            notification.setProduitId(produit.getIdProduit());
            notification.setMessage("Alerte: Stock faible pour " + produit.getDesignation() +
                    ". Quantité actuelle: " + produit.getQuantiteStock() +
                    ", Seuil d'alerte: " + produit.getSeuilAlerte());
            notification.setTypeNotification("ALERTE_STOCK");
            notification.setRoleCible("ADMIN");
            notification.setStatut("NON_LUE");
            notificationRepository.save(notification);

            // Send Email to all Admins
            List<Utilisateur> admins = utilisateurRepository.findByRole("ADMIN");
            for (Utilisateur admin : admins) {
                if (admin.getEmail() != null && !admin.getEmail().isEmpty()) {
                    try {
                        emailService.sendLowStockAlertEmail(
                                admin.getEmail(),
                                produit.getDesignation(),
                                produit.getQuantiteStock(),
                                produit.getSeuilAlerte());
                    } catch (Exception e) {
                        System.err.println("Erreur envoi email alerte stock a " + admin.getEmail());
                    }
                }
            }
        }
    }
}

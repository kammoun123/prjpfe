package com.example.gestion_piece_back.service;

import com.example.gestion_piece_back.model.Utilisateur;
import com.example.gestion_piece_back.model.Notification;
import com.example.gestion_piece_back.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UtilisateurService {
    private final UtilisateurRepository utilisateurRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public Utilisateur register(Utilisateur utilisateur) {
        if (utilisateur.getMotDePasse() == null || utilisateur.getMotDePasse().isBlank()) {
            throw new RuntimeException("Le mot de passe est obligatoire pour l'inscription");
        }
        utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
        utilisateur.setStatut("PENDING"); // Les nouveaux utilisateurs sont en attente par défaut
        Utilisateur savedUser = utilisateurRepository.save(utilisateur);

        // Créer une notification pour l'administrateur
        try {
            Notification notification = new Notification();
            notification.setTitre("Nouvelle Inscription");
            notification.setMessage("Un nouvel utilisateur [" + savedUser.getPrenom() + " " + savedUser.getNom()
                    + "] vient de s'inscrire et attend votre validation.");
            notification.setTypeNotification("USER_REGISTRATION");
            notification.setRoleCible("ADMIN");
            notification.setStatut("NON_LUE");
            notificationService.saveNotification(notification);
        } catch (Exception e) {
            System.err.println("Erreur lors de la création de la notification d'inscription : " + e.getMessage());
        }

        return savedUser;
    }

    public List<Utilisateur> findAll() {
        return utilisateurRepository.findAll();
    }

    public Optional<Utilisateur> findById(Long id) {
        return utilisateurRepository.findById(id);
    }

    public Utilisateur updateStatus(Long id, String status) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setStatut(status);
        Utilisateur updatedUser = utilisateurRepository.save(user);

        // Envoyer un email en fonction du nouveau statut
        try {
            if ("ACTIVE".equalsIgnoreCase(status)) {
                emailService.sendUserAcceptedEmail(user.getEmail(), user.getPrenom());
            } else if ("INACTIVE".equalsIgnoreCase(status) || "REFUSED".equalsIgnoreCase(status)) {
                emailService.sendUserRefusedEmail(user.getEmail(), user.getPrenom());
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email : " + e.getMessage());
            // On ne bloque pas la transaction si l'email échoue
        }

        return updatedUser;
    }

    public Utilisateur updateUtilisateur(Long id, Utilisateur userDetails) {
        System.out.println("Updating user ID: " + id);
        System.out.println("Payload: ville=" + userDetails.getVille() + ", gouvernorat=" + userDetails.getGouvernorat()
                + ", telephone=" + userDetails.getTelephone());

        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setNom(userDetails.getNom());
        user.setPrenom(userDetails.getPrenom());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setVille(userDetails.getVille());
        user.setGouvernorat(userDetails.getGouvernorat());
        user.setTelephone(userDetails.getTelephone());

        if (userDetails.getMotDePasse() != null && !userDetails.getMotDePasse().isBlank()) {
            user.setMotDePasse(passwordEncoder.encode(userDetails.getMotDePasse()));
        }
        return utilisateurRepository.save(user);
    }

    public void delete(Long id) {
        utilisateurRepository.deleteById(id);
    }

    public Optional<Utilisateur> findByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }
}

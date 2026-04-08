package com.example.gestion_piece_back.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendUserAcceptedEmail(String to, String name) {
        String subject = "Félicitations ! Votre compte a été activé";
        String body = "Bonjour " + name + ",\n\n" +
                "Nous avons le plaisir de vous informer que votre compte sur l'application G-PRODUITS a été accepté par un administrateur.\n" +
                "Vous pouvez maintenant vous connecter en utilisant vos identifiants.\n\n" +
                "Cordialement,\n" +
                "L'équipe G-PRODUITS";
        sendEmail(to, subject, body);
    }

    public void sendUserRefusedEmail(String to, String name) {
        String subject = "Information concernant votre demande d'inscription";
        String body = "Bonjour " + name + ",\n\n" +
                "Nous vous informons que votre demande d'inscription sur l'application G-PRODUITS n'a pas été retenue pour le moment.\n" +
                "Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.\n\n" +
                "Cordialement,\n" +
                "L'équipe G-PRODUITS";
        sendEmail(to, subject, body);
    }

    public void sendLowStockAlertEmail(String to, String produitName, int stock, int seuil) {
        String subject = "ALERTE STOCK: " + produitName + " en rupture ou sous le seuil";
        String body = "Bonjour Admin,\n\n" +
                "Le produit \"" + produitName + "\" a atteint ou dépassé son seuil d'alerte critique suite à un mouvement de stock.\n\n" +
                "Stock actuel : " + stock + "\n" +
                "Seuil d'alerte : " + seuil + "\n\n" +
                "Veuillez vérifier les stocks rapidement.\n\n" +
                "Cordialement,\n" +
                "G-PRODUITS Système d'Alerte";
        sendEmail(to, subject, body);
    }

    public void sendNewDemandeEmail(String to, String produitName, Integer quantite, String demandeurNom) {
        String subject = "NOUVELLE DEMANDE DE PRODUIT: " + produitName;
        String body = "Bonjour Admin,\n\n" +
                "Une nouvelle demande de produit a été soumise.\n\n" +
                "Produit : " + produitName + "\n" +
                "Quantité : " + quantite + "\n" +
                "Demandé par : " + demandeurNom + "\n\n" +
                "Veuillez consulter le tableau de bord pour traiter cette demande.\n\n" +
                "Cordialement,\n" +
                "G-PRODUITS Système de Gestion";
        sendEmail(to, subject, body);
    }
}

package com.example.gestion_piece_back.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    public void sendOrderEmail(String destinataire, String fournisseurNom, String produitRequis, Integer quantite, String motif, java.time.LocalDate dateLivraison) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(destinataire);
            helper.setSubject("NOUVELLE COMMANDE - G-PIÈCES");

            String dateLivraisonStr = (dateLivraison != null) ? dateLivraison.toString() : "Dès que possible";

            String htmlContent = "<html>"
                    + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>"
                    + "<div style='max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);'>"
                    + "<h2 style='color: #4f46e5; text-align: center;'>Bon de Commande G-PIÈCES</h2>"
                    + "<p>Bonjour <strong>" + fournisseurNom + "</strong>,</p>"
                    + "<p>Nous souhaitons passer une commande pour le produit suivant :</p>"
                    + "<table style='width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;'>"
                    + "<tr><th style='border: 1px solid #ddd; padding: 10px; background-color: #f8fafc; text-align: left;'>Produit</th>"
                    + "<td style='border: 1px solid #ddd; padding: 10px;'>" + produitRequis + "</td></tr>"
                    + "<tr><th style='border: 1px solid #ddd; padding: 10px; background-color: #f8fafc; text-align: left;'>Quantité</th>"
                    + "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>" + quantite + "</td></tr>"
                    + "<tr><th style='border: 1px solid #ddd; padding: 10px; background-color: #f8fafc; text-align: left;'>Date de Livraison Prévue</th>"
                    + "<td style='border: 1px solid #ddd; padding: 10px; color: #d97706; font-weight: bold;'>" + dateLivraisonStr + "</td></tr>"
                    + "<tr><th style='border: 1px solid #ddd; padding: 10px; background-color: #f8fafc; text-align: left;'>Motif / Infos</th>"
                    + "<td style='border: 1px solid #ddd; padding: 10px;'>" + ((motif != null && !motif.isEmpty()) ? motif : "N/A") + "</td></tr>"
                    + "</table>"
                    + "<p>Merci de traiter cette commande dans les meilleurs délais.</p>"
                    + "<p style='margin-top: 30px; font-size: 12px; color: #888; text-align: center;'>Cet email est généré automatiquement par le système G-PIÈCES.</p>"
                    + "</div>"
                    + "</body>"
                    + "</html>";

            helper.setText(htmlContent, true);

            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur lors de l'envoi de l'email à : " + destinataire);
            e.printStackTrace();
            throw new RuntimeException("Erreur serveur lors de l'envoi de l'email de commande.");
        }
    }

    public void sendLowStockAlertEmail(String toEmail, String produitDesignation, Integer quantiteActuelle, Integer seuilAlerte) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("ALERTE STOCK FAIBLE - G-PIÈCES");

            String htmlContent = "<html><body><h2 style='color: red;'>Alerte Stock Faible</h2>"
                    + "<p>Le produit <strong>" + produitDesignation + "</strong> a atteint un niveau critique.</p>"
                    + "<ul><li>Quantité Actuelle: " + quantiteActuelle + "</li>"
                    + "<li>Seuil d'alerte: " + seuilAlerte + "</li></ul>"
                    + "<p>Veuillez réapprovisionner l'inventaire.</p></body></html>";

            helper.setText(htmlContent, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur lors de l'envoi de l'alerte stock: " + e.getMessage());
        }
    }

    public void sendUserAcceptedEmail(String toEmail, String prenom) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Compte Approuvé - G-PIÈCES");

            String htmlContent = "<html><body><h2 style='color: green;'>Félicitations " + prenom + " !</h2>"
                    + "<p>Votre compte sur l'application G-PIÈCES a été approuvé par un administrateur.</p>"
                    + "<p>Vous pouvez maintenant vous connecter et utiliser l'application.</p></body></html>";

            helper.setText(htmlContent, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur email: " + e.getMessage());
        }
    }

    public void sendUserRefusedEmail(String toEmail, String prenom) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Statut du compte - G-PIÈCES");

            String htmlContent = "<html><body><h2 style='color: red;'>Bonjour " + prenom + ",</h2>"
                    + "<p>Nous sommes au regret de vous informer que votre compte G-PIÈCES a été désactivé ou refusé.</p>"
                    + "<p>Veuillez contacter un administrateur pour plus d'informations.</p></body></html>";

            helper.setText(htmlContent, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur email: " + e.getMessage());
        }
    }
}

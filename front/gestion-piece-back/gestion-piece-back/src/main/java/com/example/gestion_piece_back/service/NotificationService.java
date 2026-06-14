package com.example.gestion_piece_back.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.gestion_piece_back.model.Notification;
import com.example.gestion_piece_back.repository.NotificationRepository;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification saveNotification(Notification notification) {
        if (notification.getDateCreation() == null) {
            notification.setDateCreation(java.time.LocalDateTime.now());
        }
        return notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByStatut("NON_LUE");
    }

    public List<Notification> getNotificationsByProduit(Long produitId) {
        return notificationRepository.findByProduitId(produitId);
    }

    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification != null) {
            notification.setStatut("LUE");
            return notificationRepository.save(notification);
        }
        return null;
    }

    public void markAllAsRead() {
        List<Notification> unread = getUnreadNotifications();
        unread.forEach(n -> {
            n.setStatut("LUE");
            notificationRepository.save(n);
        });
    }

    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}

package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByStatut(String statut);
    List<Notification> findByProduitId(Long produitId);
    List<Notification> findByRoleCible(String roleCible);
    List<Notification> findByRoleCibleAndStatut(String roleCible, String statut);
}

package com.example.gestion_piece_back.controller;

import com.example.gestion_piece_back.model.Utilisateur;
import com.example.gestion_piece_back.service.UtilisateurService;
import com.example.gestion_piece_back.config.JwtUtils;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurService utilisateurService;
    private final UserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid Utilisateur utilisateur) {
        if (utilisateurService.findByEmail(utilisateur.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email déjà utilisé");
        }
        return ResponseEntity.ok(utilisateurService.register(utilisateur));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse()));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body("Email ou mot de passe incorrect");
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body("Compte désactivé");
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body("Échec de l'authentification");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String jwt = jwtUtils.generateToken(userDetails);

        Utilisateur user = utilisateurService.findByEmail(request.getEmail()).get();
        return ResponseEntity.ok(new AuthResponse(jwt, user));
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    static class LoginRequest {
        private String email;
        private String motDePasse;
    }

    @Data
    @AllArgsConstructor
    static class AuthResponse {
        private String token;
        private Utilisateur user;
    }
}

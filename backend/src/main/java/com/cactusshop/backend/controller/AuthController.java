package com.cactusshop.backend.controller;

import com.cactusshop.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        // Hardcodăm credențialele tale de administrator
        if ("admin".equals(username) && "parola123".equals(password)) {
            String token = jwtUtil.generateToken(username);
            return ResponseEntity.ok(Map.of("token", token)); // Trimitem token-ul înapoi sub formă de JSON
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Date incorecte");
        }
    }
}
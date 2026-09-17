package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CustomerLoginDTO;
import com.cactusshop.backend.dto.CustomerProfileDTO;
import com.cactusshop.backend.dto.CustomerRegisterDTO;
import com.cactusshop.backend.dto.CustomerUpdateDTO;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.security.JwtUtil;
import com.cactusshop.backend.security.LoginRateLimiter;
import com.cactusshop.backend.service.CustomerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerAuthController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginRateLimiter rateLimiter;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody CustomerRegisterDTO request) {
        try {
            Customer customer = customerService.register(request);
            String token = jwtUtil.generateToken(customer.getEmail(), "CUSTOMER");
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtUtil.createJwtCookie(token).toString())
                    .body(Map.of("name", customer.getName()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody CustomerLoginDTO request, HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);

        if (rateLimiter.isBlocked(clientIp)) {
            long minutes = rateLimiter.minutesRemaining(clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Prea multe incercari esuate. Incearca din nou peste " + minutes + " minute.");
        }

        Customer customer = customerService.authenticate(request.email(), request.password());
        if (customer == null) {
            rateLimiter.recordFailure(clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email sau parola incorecte.");
        }

        rateLimiter.recordSuccess(clientIp);
        String token = jwtUtil.generateToken(customer.getEmail(), "CUSTOMER");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtUtil.createJwtCookie(token).toString())
                .body(Map.of("name", customer.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtUtil.createLogoutCookie().toString())
                .body(Map.of("message", "Deconectat"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        try {
            CustomerProfileDTO profile = customerService.getProfile(authentication.getName());
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(Authentication authentication, @Valid @RequestBody CustomerUpdateDTO request) {
        try {
            CustomerProfileDTO profile = customerService.updateAddress(authentication.getName(), request);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
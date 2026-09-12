package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CustomerLoginDTO;
import com.cactusshop.backend.dto.CustomerProfileDTO;
import com.cactusshop.backend.dto.CustomerRegisterDTO;
import com.cactusshop.backend.dto.CustomerUpdateDTO;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.repository.CustomerRepository;
import com.cactusshop.backend.security.JwtUtil;
import com.cactusshop.backend.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerAuthController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private LoginRateLimiter rateLimiter;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody CustomerRegisterDTO request) {

        String email = request.email().trim().toLowerCase();

        if (customerRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Există deja un cont cu acest email.");
        }

        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setEmail(email);
        customer.setPasswordHash(passwordEncoder.encode(request.password()));
        customer.setAddress(request.address().trim());

        customerRepository.save(customer);

        String token = jwtUtil.generateToken(email, "CUSTOMER");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtUtil.createJwtCookie(token).toString())
                .body(Map.of("name", customer.getName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody CustomerLoginDTO request, HttpServletRequest httpRequest) {

        String clientIp = extractClientIp(httpRequest);

        if (rateLimiter.isBlocked(clientIp)) {
            long minutes = rateLimiter.minutesRemaining(clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Prea multe încercări eșuate. Încearcă din nou peste " + minutes + " minute.");
        }

        String email = request.email().trim().toLowerCase();
        Customer customer = customerRepository.findByEmail(email).orElse(null);

        if (customer == null || !passwordEncoder.matches(request.password(), customer.getPasswordHash())) {
            rateLimiter.recordFailure(clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email sau parolă incorecte.");
        }

        rateLimiter.recordSuccess(clientIp);
        String token = jwtUtil.generateToken(email, "CUSTOMER");
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

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        Customer customer = customerRepository.findByEmail(email).orElse(null);

        if (customer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cont inexistent.");
        }

        return ResponseEntity.ok(new CustomerProfileDTO(customer.getName(), customer.getEmail(), customer.getAddress()));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(Authentication authentication, @Valid @RequestBody CustomerUpdateDTO request) {
        String email = authentication.getName();
        Customer customer = customerRepository.findByEmail(email).orElse(null);

        if (customer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cont inexistent.");
        }

        customer.setAddress(request.address().trim());
        customerRepository.save(customer);

        return ResponseEntity.ok(new CustomerProfileDTO(customer.getName(), customer.getEmail(), customer.getAddress()));
    }
}
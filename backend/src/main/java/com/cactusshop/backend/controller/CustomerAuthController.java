package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CustomerLoginDTO;
import com.cactusshop.backend.dto.CustomerProfileDTO;
import com.cactusshop.backend.dto.CustomerRegisterDTO;
import com.cactusshop.backend.dto.CustomerUpdateDTO;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.repository.CustomerRepository;
import com.cactusshop.backend.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
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
        return ResponseEntity.ok(Map.of("token", token, "name", customer.getName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody CustomerLoginDTO request) {

        String email = request.email().trim().toLowerCase();
        Customer customer = customerRepository.findByEmail(email).orElse(null);

        if (customer == null || !passwordEncoder.matches(request.password(), customer.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email sau parolă incorecte.");
        }

        String token = jwtUtil.generateToken(email, "CUSTOMER");
        return ResponseEntity.ok(Map.of("token", token, "name", customer.getName()));
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
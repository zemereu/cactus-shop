package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CustomerLoginDTO;
import com.cactusshop.backend.dto.CustomerRegisterDTO;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.repository.CustomerRepository;
import com.cactusshop.backend.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "https://cactshop.netlify.app")
public class CustomerAuthController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody CustomerRegisterDTO request) {

        String email = request.getEmail().trim().toLowerCase();

        if (customerRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Există deja un cont cu acest email.");
        }

        Customer customer = new Customer();
        customer.setName(request.getName().trim());
        customer.setEmail(email);
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setAddress(request.getAddress().trim());

        customerRepository.save(customer);

        // Auto-login după înregistrare — clientul nu trebuie să se
        // autentifice separat imediat după ce și-a creat contul.
        String token = jwtUtil.generateToken(email, "CUSTOMER");
        return ResponseEntity.ok(Map.of("token", token, "name", customer.getName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody CustomerLoginDTO request) {

        String email = request.getEmail().trim().toLowerCase();
        Customer customer = customerRepository.findByEmail(email).orElse(null);

        if (customer == null || !passwordEncoder.matches(request.getPassword(), customer.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email sau parolă incorecte.");
        }

        String token = jwtUtil.generateToken(email, "CUSTOMER");
        return ResponseEntity.ok(Map.of("token", token, "name", customer.getName()));
    }
}
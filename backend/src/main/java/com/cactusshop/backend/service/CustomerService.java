package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.CustomerProfileDTO;
import com.cactusshop.backend.dto.CustomerRegisterDTO;
import com.cactusshop.backend.dto.CustomerUpdateDTO;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public Customer register(CustomerRegisterDTO request) {
        String email = request.email().trim().toLowerCase();

        if (customerRepository.existsByEmail(email)) {
            throw new IllegalStateException("Exista deja un cont cu acest email.");
        }

        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setEmail(email);
        customer.setPasswordHash(passwordEncoder.encode(request.password()));
        customer.setAddress(request.address().trim());

        return customerRepository.save(customer);
    }

    public Customer authenticate(String email, String password) {
        Customer customer = customerRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (customer == null || !passwordEncoder.matches(password, customer.getPasswordHash())) {
            return null;
        }
        return customer;
    }

    public boolean verifyAccount(String token) {
        Customer customer = customerRepository.findByVerificationToken(token).orElse(null);
        if (customer == null || customer.isVerified()) return false;
        customer.setVerified(true);
        customer.setVerificationToken(null); // token consumat
        customerRepository.save(customer);
        return true;
    }

    public String resendVerification(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Cont inexistent."));
        if (customer.isVerified()) return null; // deja verificat
        String newToken = java.util.UUID.randomUUID().toString();
        customer.setVerificationToken(newToken);
        customerRepository.save(customer);
        return newToken;
    }

    public CustomerProfileDTO getProfile(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Cont inexistent."));
        return new CustomerProfileDTO(customer.getName(), customer.getEmail(), customer.getAddress(), customer.isVerified());
    }

    public CustomerProfileDTO updateAddress(String email, CustomerUpdateDTO request) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Cont inexistent."));
        customer.setAddress(request.address().trim());
        customerRepository.save(customer);
        return new CustomerProfileDTO(customer.getName(), customer.getEmail(), customer.getAddress(), customer.isVerified());
    }
}
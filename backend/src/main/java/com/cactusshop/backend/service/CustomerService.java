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

    public CustomerProfileDTO getProfile(String email) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Cont inexistent."));
        return new CustomerProfileDTO(customer.getName(), customer.getEmail(), customer.getAddress());
    }

    public CustomerProfileDTO updateAddress(String email, CustomerUpdateDTO request) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Cont inexistent."));
        customer.setAddress(request.address().trim());
        customerRepository.save(customer);
        return new CustomerProfileDTO(customer.getName(), customer.getEmail(), customer.getAddress());
    }
}
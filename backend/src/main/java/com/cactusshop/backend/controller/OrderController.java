package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.OrderRequestDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.model.Order;
import com.cactusshop.backend.repository.CactusRepository;
import com.cactusshop.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "https://cactshop.netlify.app")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CactusRepository cactusRepository;

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequestDTO request) {

        // --- Validări de bază ---
        if (request.getCustomerName() == null || request.getCustomerName().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Numele clientului este obligatoriu.");
        }
        if (request.getAddress() == null || request.getAddress().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Adresa de livrare este obligatorie.");
        }
        if (request.getCactusIds() == null || request.getCactusIds().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Coșul este gol.");
        }

        // --- Preluăm produsele REALE din baza de date, după ID ---
        // NU avem încredere în niciun preț trimis de client — doar în ID-uri,
        // și calculăm totalul din prețurile efective salvate în baza de date.
        List<Cactus> purchasedCacti = new ArrayList<>();
        for (Long id : request.getCactusIds()) {
            Cactus cactus = cactusRepository.findById(id).orElse(null);
            if (cactus == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Produs invalid sau inexistent (id: " + id + ").");
            }
            purchasedCacti.add(cactus);
        }

        double realTotal = purchasedCacti.stream().mapToDouble(Cactus::getPrice).sum();
        String itemsSummary = purchasedCacti.stream().map(Cactus::getName).collect(Collectors.joining(", "));

        // --- Construim comanda cu date de încredere, nu cu ce a trimis clientul ---
        Order order = new Order();
        order.setCustomerName(request.getCustomerName().trim());
        order.setAddress(request.getAddress().trim());
        order.setTotalPrice(realTotal);
        order.setPurchasedItems(itemsSummary);

        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(saved);
    }

    // Vom folosi acest endpoint mai târziu, în panoul de Admin, pentru a vedea comenzile
    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
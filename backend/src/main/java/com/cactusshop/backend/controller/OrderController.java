package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.OrderRequestDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.model.Order;
import com.cactusshop.backend.repository.CactusRepository;
import com.cactusshop.backend.repository.OrderRepository;
import jakarta.validation.Valid;
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
    public ResponseEntity<?> placeOrder(@Valid @RequestBody OrderRequestDTO request) {

        // --- Preluăm produsele REALE din baza de date, după ID ---
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

        Order order = new Order();
        order.setCustomerName(request.getCustomerName().trim());
        order.setAddress(request.getAddress().trim());
        order.setTotalPrice(realTotal);
        order.setPurchasedItems(itemsSummary);

        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
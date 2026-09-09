package com.cactusshop.backend.controller;

import com.cactusshop.backend.model.Order;
import com.cactusshop.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "https://cactshop.netlify.app")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @PostMapping
    public Order placeOrder(@RequestBody Order order) {
        return orderRepository.save(order);
    }

    // Vom folosi acest endpoint mai târziu, în panoul de Admin, pentru a vedea comenzile
    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
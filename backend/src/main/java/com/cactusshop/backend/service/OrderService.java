package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.OrderRequestDTO;
import com.cactusshop.backend.dto.OrderStatusResponseDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.model.Order;
import com.cactusshop.backend.repository.CactusRepository;
import com.cactusshop.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CactusRepository cactusRepository;

    private static final Set<String> VALID_STATUSES = Set.of(
            "Neplătită", "Plătită - în pregătire", "Expediată", "Livrată"
    );

    public Order placeOrder(OrderRequestDTO request) {
        List<Cactus> purchasedCacti = new ArrayList<>();

        for (Long id : request.cactusIds()) {
            Cactus cactus = cactusRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Produs invalid sau inexistent (id: " + id + ")."));

            if (cactus.getStock() <= 0) {
                throw new IllegalStateException(
                        "Produsul \"" + cactus.getName() + "\" nu mai este in stoc.");
            }
            purchasedCacti.add(cactus);
        }

        for (Cactus cactus : purchasedCacti) {
            cactus.setStock(cactus.getStock() - 1);
            cactusRepository.save(cactus);
        }

        double realTotal = purchasedCacti.stream().mapToDouble(Cactus::getPrice).sum();
        String itemsSummary = purchasedCacti.stream()
                .map(Cactus::getName)
                .collect(Collectors.joining(", "));

        Order order = new Order();
        order.setCustomerName(request.customerName().trim());
        order.setEmail(request.email().trim());
        order.setAddress(request.address().trim());
        order.setTotalPrice(realTotal);
        order.setPurchasedItems(itemsSummary);
        order.setStatus("Neplătită");

        return orderRepository.save(order);
    }

    public OrderStatusResponseDTO lookupOrder(Long orderId, String email) {
        Order order = orderRepository.findById(orderId).orElse(null);

        if (order == null || order.getEmail() == null
                || !order.getEmail().equalsIgnoreCase(email.trim())) {
            return null;
        }

        return new OrderStatusResponseDTO(
                order.getId(), order.getStatus(), order.getPurchasedItems(), order.getTotalPrice());
    }

    public Order updateStatus(Long id, String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new IllegalArgumentException(
                    "Status invalid. Valorile acceptate: " + VALID_STATUSES);
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comanda nu a fost găsită."));

        order.setStatus(status);
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.OrderRequestDTO;
import com.cactusshop.backend.dto.OrderStatusResponseDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.model.Order;
import com.cactusshop.backend.repository.CactusRepository;
import com.cactusshop.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
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

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    // authenticatedEmail e null pentru comenzi guest (neautentificat).
    // Dacă e prezent (client logat), IGNORĂM emailul trimis din formular
    // și folosim emailul real al contului — altfel un typo sau un email
    // diferit tastat la checkout ar rupe legătura cu "Comenzile mele",
    // exact bug-ul raportat.
    @Transactional
    public Order placeOrder(OrderRequestDTO request, String authenticatedEmail) {
        Map<Long, Integer> quantityMap = new LinkedHashMap<>();
        for (Long id : request.cactusIds()) {
            quantityMap.merge(id, 1, Integer::sum);
        }

        List<String> itemNames = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        // Un singur query în loc de N findById-uri
        Map<Long, Cactus> cactiMap = new HashMap<>();
        for (Cactus c : cactusRepository.findAllById(quantityMap.keySet())) {
            cactiMap.put(c.getId(), c);
        }

        for (Map.Entry<Long, Integer> entry : quantityMap.entrySet()) {
            Long id = entry.getKey();
            int qty = entry.getValue();

            Cactus cactus = cactiMap.get(id);
            if (cactus == null) {
                throw new IllegalArgumentException("Produs invalid sau inexistent (id: " + id + ").");
            }

            int updated = cactusRepository.decrementStock(id, qty);
            if (updated == 0) {
                throw new IllegalStateException(
                        "Stoc insuficient pentru \"" + cactus.getName() + "\".");
            }

            for (int i = 0; i < qty; i++) {
                itemNames.add(cactus.getName());
            }
            total = total.add(cactus.getPrice().multiply(BigDecimal.valueOf(qty)));
        }

        Order order = new Order();
        order.setCustomerName(request.customerName().trim());
        order.setEmail(authenticatedEmail != null ? authenticatedEmail : request.email().trim());
        order.setAddress(request.address().trim());
        order.setTotalPrice(total);
        order.setPurchasedItems(String.join(", ", itemNames));
        order.setStatus("Neplătită");

        return orderRepository.save(order);
    }

    public OrderStatusResponseDTO lookupOrder(String orderToken, String email) {
        Order order = orderRepository.findByOrderToken(orderToken).orElse(null);

        if (order == null || order.getEmail() == null
                || !order.getEmail().equalsIgnoreCase(email.trim())) {
            return null;
        }

        return new OrderStatusResponseDTO(
                order.getId(), order.getOrderToken(), order.getStatus(),
                order.getPurchasedItems(), order.getTotalPrice(),
                order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMAT) : "");
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

    public List<OrderStatusResponseDTO> getOrdersByEmail(String email) {
        List<Order> orders = orderRepository.findByEmailIgnoreCaseOrderByIdDesc(email);
        return orders.stream().map(o -> new OrderStatusResponseDTO(
                o.getId(), o.getOrderToken(), o.getStatus(), o.getPurchasedItems(), o.getTotalPrice(),
                o.getCreatedAt() != null ? o.getCreatedAt().format(DATE_FORMAT) : ""
        )).collect(Collectors.toList());
    }
}
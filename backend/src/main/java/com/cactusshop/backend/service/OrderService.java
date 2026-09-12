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

    @Transactional
    public Order placeOrder(OrderRequestDTO request) {
        // Contorizează câte bucăți din fiecare produs
        Map<Long, Integer> quantityMap = new LinkedHashMap<>();
        for (Long id : request.cactusIds()) {
            quantityMap.merge(id, 1, Integer::sum);
        }

        // Validează existența și scade stocul atomic
        List<String> itemNames = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : quantityMap.entrySet()) {
            Long id = entry.getKey();
            int qty = entry.getValue();

            Cactus cactus = cactusRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Produs invalid sau inexistent (id: " + id + ")."));

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
        order.setEmail(request.email().trim());
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
                order.getPurchasedItems(), order.getTotalPrice());
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
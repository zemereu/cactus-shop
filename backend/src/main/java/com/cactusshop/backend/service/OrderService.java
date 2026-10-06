package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.OrderRequestDTO;
import com.cactusshop.backend.dto.OrderStatusResponseDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.model.Customer;
import com.cactusshop.backend.model.Order;
import com.cactusshop.backend.repository.CactusRepository;
import com.cactusshop.backend.repository.CustomerRepository;
import com.cactusshop.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CactusRepository cactusRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final Set<String> VALID_STATUSES = Set.of(
            "Neplătită", "Plătită - în pregătire", "Expediată", "Livrată"
    );

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    // Only the authenticated principal can establish account ownership.
    // Guest email addresses remain contact details, never account identifiers.
    @Transactional
    public Order placeOrder(
            OrderRequestDTO request,
            String authenticatedEmail,
            String idempotencyKey) {

        if (idempotencyKey == null || !idempotencyKey.matches(
                "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
            throw new IllegalArgumentException(
                    "Este necesară o cheie Idempotency-Key UUID validă.");
        }

        UUID key = UUID.fromString(idempotencyKey);
        Customer customer =
                authenticatedEmail == null ? null : requireCustomer(authenticatedEmail);

        Map<Long, Integer> quantityMap = new TreeMap<>();
        for (Long id : request.cactusIds()) {
            if (id == null || id <= 0) {
                throw new IllegalArgumentException("Produs invalid.");
            }
            quantityMap.merge(id, 1, Integer::sum);
        }

        String email = customer != null ? customer.getEmail() : request.email().trim();
        String hash = requestHash(request, customer, email, quantityMap);

        // PostgreSQL holds this per-key lock until commit/rollback,
        // including across app instances.
        // A hash collision only serializes unrelated requests;
        // the full UUID remains unique in the DB.
        jdbcTemplate.queryForList(
                "SELECT pg_advisory_xact_lock(?)",
                key.getMostSignificantBits() ^ key.getLeastSignificantBits());

        Optional<Order> previous = orderRepository.findByIdempotencyKey(key);
        if (previous.isPresent()) {
            if (!hash.equals(previous.get().getRequestHash())) {
                throw new IllegalArgumentException(
                        "Cheia comenzii a fost deja folosită pentru alte date.");
            }
            return previous.get();
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
            if (cactus == null || !cactus.isActive()) {
                throw new IllegalArgumentException(
                        "Produs indisponibil (id: " + id + ").");
            }

            for (int i = 0; i < qty; i++) {
                itemNames.add(cactus.getName());
            }
            total = total.add(
                    cactus.getPrice().multiply(BigDecimal.valueOf(qty)));
        }

        if (request.expectedTotal() == null
                || total.compareTo(request.expectedTotal()) != 0) {
            throw new IllegalArgumentException(
                    "Prețul s-a modificat. Verifică totalul actualizat și confirmă din nou comanda.");
        }

        for (Map.Entry<Long, Integer> entry : quantityMap.entrySet()) {
            Long id = entry.getKey();
            int qty = entry.getValue();
            Cactus cactus = cactiMap.get(id);

            int updated = cactusRepository.decrementStock(id, qty);
            if (updated == 0) {
                throw new IllegalStateException(
                        "Produs indisponibil sau stoc insuficient pentru \""
                                + cactus.getName() + "\".");
            }
        }

        Order order = new Order();
        order.setCustomerName(request.customerName().trim());
        order.setEmail(email);
        order.setCustomer(customer);
        order.setIdempotencyKey(key);
        order.setRequestHash(hash);
        order.setAddress(request.address().trim());
        order.setTotalPrice(total);
        order.setPurchasedItems(String.join(", ", itemNames));
        order.setStatus("Neplătită");

        return orderRepository.save(order);
    }

    private String requestHash(
            OrderRequestDTO request,
            Customer customer,
            String email,
            Map<Long, Integer> quantities) {

        byte[] canonical = JsonMapper.builder().build().writeValueAsBytes(List.of(
                customer == null ? "guest" : customer.getId().toString(),
                request.customerName().trim(),
                email.toLowerCase(Locale.ROOT),
                request.address().trim(),
                quantities,
                request.expectedTotal() == null
                        ? "missing"
                        : request.expectedTotal().stripTrailingZeros().toPlainString()));

        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(canonical));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponibil", e);
        }
    }

    public OrderStatusResponseDTO lookupOrder(String orderToken, String email) {
        Order order = orderRepository.findByOrderToken(orderToken).orElse(null);

        if (order == null || order.getEmail() == null
                || !order.getEmail().equalsIgnoreCase(email.trim())) {
            return null;
        }

        return new OrderStatusResponseDTO(
                order.getId(),
                order.getOrderToken(),
                order.getStatus(),
                order.getPurchasedItems(),
                order.getTotalPrice(),
                order.getCreatedAt() != null
                        ? order.getCreatedAt().format(DATE_FORMAT)
                        : "");
    }

    public Order updateStatus(Long id, String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new IllegalArgumentException(
                    "Status invalid. Valorile acceptate: " + VALID_STATUSES);
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Comanda nu a fost găsită."));

        order.setStatus(status);
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<OrderStatusResponseDTO> getOrdersForCustomer(String authenticatedEmail) {
        Customer customer = requireCustomer(authenticatedEmail);
        List<Order> orders =
                orderRepository.findByCustomer_IdOrderByIdDesc(customer.getId());

        return orders.stream().map(o -> new OrderStatusResponseDTO(
                o.getId(),
                o.getOrderToken(),
                o.getStatus(),
                o.getPurchasedItems(),
                o.getTotalPrice(),
                o.getCreatedAt() != null
                        ? o.getCreatedAt().format(DATE_FORMAT)
                        : ""
        )).collect(Collectors.toList());
    }

    private Customer requireCustomer(String email) {
        return customerRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("Cont inexistent."));
    }
}
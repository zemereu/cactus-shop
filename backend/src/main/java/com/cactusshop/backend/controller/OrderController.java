package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.OrderRequestDTO;
import com.cactusshop.backend.dto.OrderStatusResponseDTO;
import com.cactusshop.backend.dto.OrderStatusUpdateDTO;
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
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "https://cactshop.netlify.app")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CactusRepository cactusRepository;

    // Statusurile valide — orice altceva trimis de admin e respins
    private static final Set<String> VALID_STATUSES = Set.of(
            "Neplătită", "Plătită - în pregătire", "Expediată", "Livrată"
    );

    @PostMapping
    public ResponseEntity<?> placeOrder(@Valid @RequestBody OrderRequestDTO request) {

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
        order.setEmail(request.getEmail().trim());
        order.setAddress(request.getAddress().trim());
        order.setTotalPrice(realTotal);
        order.setPurchasedItems(itemsSummary);
        order.setStatus("Neplătită"); // orice comandă nouă pornește neplătită, indiferent ce ar trimite clientul

        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(saved);
    }

    // Verificare PUBLICĂ a statusului unei comenzi — necesită id + email,
    // ca să nu poată oricine ghici id-uri secvențiale și vedea comenzi străine.
    @GetMapping("/lookup")
    public ResponseEntity<?> lookupOrder(
            @RequestParam Long orderId,
            @RequestParam String email) {

        Order order = orderRepository.findById(orderId).orElse(null);

        if (order == null || order.getEmail() == null || !order.getEmail().equalsIgnoreCase(email.trim())) {
            // Același mesaj indiferent dacă id-ul nu există sau emailul nu se potrivește,
            // ca să nu oferim indicii cuiva care încearcă id-uri la întâmplare.
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Nu am găsit nicio comandă cu aceste date.");
        }

        OrderStatusResponseDTO response = new OrderStatusResponseDTO(
                order.getId(), order.getStatus(), order.getPurchasedItems(), order.getTotalPrice());
        return ResponseEntity.ok(response);
    }

    // Actualizare status — necesită autentificare admin (protejat deja
    // implicit prin SecurityConfig, orice altceva decât GET /lookup și POST necesită JWT)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusUpdateDTO request) {

        if (!VALID_STATUSES.contains(request.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Status invalid. Valorile acceptate: " + VALID_STATUSES);
        }

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Comanda nu a fost găsită.");
        }

        order.setStatus(request.getStatus());
        Order saved = orderRepository.save(order);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.OrderRequestDTO;
import com.cactusshop.backend.dto.OrderStatusResponseDTO;
import com.cactusshop.backend.dto.OrderStatusUpdateDTO;
import com.cactusshop.backend.model.Order;
import com.cactusshop.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/my")
    public ResponseEntity<?> getMyOrders(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Trebuie sa fii logat.");
        }
        String email = authentication.getName();
        List<OrderStatusResponseDTO> orders = orderService.getOrdersByEmail(email);
        return ResponseEntity.ok(orders);
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@Valid @RequestBody OrderRequestDTO request, Authentication authentication) {
        try {
            // /api/orders e permitAll (comenzi guest permise), deci Spring Security
            // populează Authentication cu un token ANONIM pentru cei nelogați —
            // nu rămâne null. Verificăm explicit rolul CUSTOMER, altfel am fi
            // folosit "anonymousUser" ca email pentru toate comenzile guest.
            String authenticatedEmail = null;
            if (authentication != null && authentication.isAuthenticated()
                    && authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
                authenticatedEmail = authentication.getName();
            }
            Order saved = orderService.placeOrder(request, authenticatedEmail);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/lookup")
    public ResponseEntity<?> lookupOrder(
            @RequestParam String orderToken,
            @RequestParam String email) {

        OrderStatusResponseDTO result = orderService.lookupOrder(orderToken, email);
        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Nu am găsit nicio comandă cu aceste date.");
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @Valid @RequestBody OrderStatusUpdateDTO request) {
        try {
            Order saved = orderService.updateStatus(id, request.status());
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }
}
package com.cactusshop.backend.dto;

import java.math.BigDecimal;

// Răspunsul public la verificarea unei comenzi — expune DOAR ce are nevoie
// clientul să vadă, nu toată entitatea Order.
public record OrderStatusResponseDTO(Long id, String status, String purchasedItems, BigDecimal totalPrice) {}
package com.cactusshop.backend.dto;

// Răspunsul public la verificarea unei comenzi — expune DOAR ce are nevoie
// clientul să vadă, nu toată entitatea Order.
public record OrderStatusResponseDTO(Long id, String status, String purchasedItems, double totalPrice) {}
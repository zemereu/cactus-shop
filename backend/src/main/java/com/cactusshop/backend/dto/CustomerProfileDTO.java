package com.cactusshop.backend.dto;

public record CustomerProfileDTO(String name, String email, String address, boolean verified,
        String firstName, String lastName, String phone, String salutation) {}

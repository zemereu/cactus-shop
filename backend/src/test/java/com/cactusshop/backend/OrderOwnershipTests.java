package com.cactusshop.backend;

import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.model.Order;
import com.cactusshop.backend.repository.CactusRepository;
import com.cactusshop.backend.repository.OrderRepository;
import com.cactusshop.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OrderOwnershipTests {
    @Autowired MockMvc mvc;
    @Autowired CactusRepository cacti;
    @Autowired OrderRepository orders;
    @Autowired JwtUtil jwt;

    private final JsonMapper json = JsonMapper.builder().build();
    private Long productId;

    @BeforeEach
    void createProduct() {
        Cactus cactus = new Cactus();
        cactus.setName("Ownership test cactus");
        cactus.setPrice(new BigDecimal("10.00"));
        cactus.setStock(10);
        productId = cacti.saveAndFlush(cactus).getId();
    }

    @Test
    void registeringEmailCannotClaimGuestOrdersBeforeOrAfterRegistration() throws Exception {
        JsonNode before = placeOrder("guest@example.test", null);
        String token = register("guest@example.test");
        placeOrder("guest@example.test", null);

        mvc.perform(get("/api/orders/my").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        assertThat(orders.findById(before.get("id").asLong()).orElseThrow().getCustomer()).isNull();
        mvc.perform(get("/api/orders/lookup")
                        .param("orderToken", before.get("orderToken").asText())
                        .param("email", "guest@example.test"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(before.get("id").asLong()));
        mvc.perform(get("/api/orders/lookup")
                        .param("orderToken", before.get("orderToken").asText())
                        .param("email", "wrong@example.test"))
                .andExpect(status().isNotFound());
    }

    @Test
    void authenticatedOrdersBelongOnlyToThePrincipalNotTheSubmittedEmail() throws Exception {
        String alice = register("alice@example.test");
        String bob = register("bob@example.test");
        JsonNode aliceOrder = placeOrder("bob@example.test", alice);
        JsonNode bobOrder = placeOrder("alice@example.test", bob);

        assertThat(aliceOrder.get("email").asText()).isEqualTo("alice@example.test");
        assertThat(aliceOrder.has("customer")).isFalse();
        assertThat(aliceOrder.toString()).doesNotContain("passwordHash");
        Order persisted = orders.findById(aliceOrder.get("id").asLong()).orElseThrow();
        assertThat(persisted.getCustomer().getEmail()).isEqualTo("alice@example.test");
        mvc.perform(get("/api/orders/my").header("Authorization", "Bearer " + alice))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(aliceOrder.get("id").asLong()));
        mvc.perform(get("/api/orders/my").header("Authorization", "Bearer " + bob))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(bobOrder.get("id").asLong()));
    }

    @Test
    void legacyOrdersStayUnassignedAndRemainAvailableByToken() throws Exception {
        // Existing rows have no trustworthy account identifier; never backfill by email.
        Order legacy = new Order();
        legacy.setEmail("legacy@example.test");
        legacy.setPurchasedItems("Legacy cactus");
        legacy.setTotalPrice(new BigDecimal("10.00"));
        orders.saveAndFlush(legacy);
        String token = register("legacy@example.test");
        JsonNode recent = placeOrder("legacy@example.test", token);

        mvc.perform(get("/api/orders/my").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(recent.get("id").asLong()));
        mvc.perform(get("/api/orders/lookup").param("orderToken", legacy.getOrderToken())
                        .param("email", "legacy@example.test"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(legacy.getId()));
    }

    @Test
    void unknownAuthenticatedAccountCannotCreateUnownedOrderOrConsumeStock() throws Exception {
        long count = orders.count();
        mvc.perform(orderRequest("missing@example.test", jwt.generateToken("missing@example.test", "CUSTOMER")))
                .andExpect(status().isBadRequest());
        assertThat(orders.count()).isEqualTo(count);
        assertThat(cacti.findById(productId).orElseThrow().getStock()).isEqualTo(10);
    }

    @Test
    void orderHistoryRequiresCustomerAuthentication() throws Exception {
        mvc.perform(get("/api/orders/my")).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders/my").header("Authorization", "Bearer " + jwt.generateToken("admin", "ADMIN")))
                .andExpect(status().isForbidden());
    }

    private String register(String email) throws Exception {
        String cookie = mvc.perform(post("/api/customers/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Test customer", "email", email,
                                "password", "TestPassword2026!", "address", "Test address"))))
                .andExpect(status().isOk()).andReturn().getResponse().getHeader("Set-Cookie");
        assertThat(cookie).startsWith("jwt=");
        return cookie.substring(4).split(";", 2)[0];
    }

    private MockHttpServletRequestBuilder orderRequest(String email, String token) {
        var request = post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("customerName", "Test buyer", "email", email,
                        "address", "Test address", "cactusIds", List.of(productId))));
        if (token != null) request.header("Authorization", "Bearer " + token);
        return request;
    }

    private JsonNode placeOrder(String email, String token) throws Exception {
        String body = mvc.perform(orderRequest(email, token)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body);
    }
}

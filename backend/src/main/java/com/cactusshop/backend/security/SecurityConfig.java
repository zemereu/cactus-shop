package com.cactusshop.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("https://cactshop.netlify.app"));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                .authorizeHttpRequests(auth -> auth
                        // --- Fisiere statice (frontend) ---
                        .requestMatchers("/", "/*.html", "/dist/**", "/images/**").permitAll()

                        // --- Public ---
                        .requestMatchers("/api/auth/login").permitAll() // login admin
                        .requestMatchers("/api/auth/logout").permitAll()
                        .requestMatchers("/api/customers/register", "/api/customers/login").permitAll() // cont client
                        .requestMatchers("/api/customers/logout").permitAll()
                        .requestMatchers("/api/customers/me", "/api/customers/me/address").hasRole("CUSTOMER") // propriul cont
                        .requestMatchers(HttpMethod.GET, "/api/cacti").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/cacti/all").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll() // comandă guest
                        .requestMatchers(HttpMethod.GET, "/api/orders/lookup").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/general").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/product/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/images/**").permitAll()

                        // --- Doar CUSTOMER ---
                        .requestMatchers(HttpMethod.GET, "/api/customers/me").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.PUT, "/api/customers/me").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/reviews").hasRole("CUSTOMER")

                        // --- Doar ADMIN ---
                        .requestMatchers(HttpMethod.POST, "/api/cacti").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/images/upload").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/cacti/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/cacti/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/orders").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reviews/pending").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/reviews/**").hasRole("ADMIN")

                        // --- Orice altceva (viitoare endpoint-uri de client) — doar autentificat, orice rol ---
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
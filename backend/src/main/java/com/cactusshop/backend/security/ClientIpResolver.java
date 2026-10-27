package com.cactusshop.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Component
public class ClientIpResolver {
    private final boolean trustRailwayProxy;

    // Enable only when every untrusted request reaches this listener through
    // Railway's public HTTP edge. Private/TCP callers bypass its header cleanup.
    public ClientIpResolver(@Value("${TRUST_RAILWAY_PROXY:false}") boolean trustRailwayProxy) {
        this.trustRailwayProxy = trustRailwayProxy;
    }

    public String resolve(HttpServletRequest request) {
        if (trustRailwayProxy) {
            var headers = request.getHeaders("X-Real-IP");
            if (headers != null && headers.hasMoreElements()) {
                String ip = normalize(headers.nextElement());
                if (ip != null && !headers.hasMoreElements()) return ip;
            }
        }
        String peer = request.getRemoteAddr();
        String normalized = normalize(peer);
        return normalized != null ? normalized : peer;
    }

    private String normalize(String value) {
        if (value == null || value.length() > 45) return null;
        String ip = value.trim();
        // Only numeric literals: never resolve caller-controlled hostnames via DNS.
        boolean ipv4 = ip.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}");
        boolean ipv6 = ip.contains(":") && ip.matches("[0-9a-fA-F:.]+");
        if (!ipv4 && !ipv6) return null;
        try {
            return InetAddress.getByName(ip).getHostAddress();
        } catch (UnknownHostException ex) {
            return null;
        }
    }
}

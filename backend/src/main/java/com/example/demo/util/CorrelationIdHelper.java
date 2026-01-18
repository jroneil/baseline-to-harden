package com.example.demo.util;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

public class CorrelationIdHelper {
    public static final String HEADER_NAME = "X-Correlation-Id";

    public static String getOrGenerate(HttpServletRequest request) {
        String id = request.getHeader(HEADER_NAME);
        return (id != null && !id.isEmpty()) ? id : UUID.randomUUID().toString();
    }
}

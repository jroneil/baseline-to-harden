package com.example.demo.web;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApiResponse {
    private boolean ok;
    private String endpoint;
    private String mode;
    private String scenario;
    private String correlationId;
    private long latencyMs;
    private String message;
    private Integer failWindowIndex;
    private boolean inFailWindow;
}

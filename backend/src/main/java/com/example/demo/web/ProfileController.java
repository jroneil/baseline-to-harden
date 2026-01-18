package com.example.demo.web;

import com.example.demo.resilience.ResilientWrapper;
import com.example.demo.service.SimulatedDownstream;
import com.example.demo.util.CorrelationIdHelper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfileController {

    private final SimulatedDownstream downstream;
    private final ResilientWrapper resilientWrapper;

    @GetMapping
    public ApiResponse getProfile(
            @RequestParam(defaultValue = "baseline") String mode,
            @RequestParam(defaultValue = "normal") String scenario,
            HttpServletRequest request) {

        long start = System.currentTimeMillis();
        String correlationId = CorrelationIdHelper.getOrGenerate(request);

        try {
            SimulatedDownstream.SimulationResult result;
            if ("hardened".equalsIgnoreCase(mode)) {
                result = resilientWrapper.execute(() -> downstream.call("profile", scenario));
            } else {
                result = downstream.call("profile", scenario);
            }

            return ApiResponse.builder()
                    .ok(true)
                    .endpoint("profile")
                    .mode(mode)
                    .scenario(scenario)
                    .correlationId(correlationId)
                    .latencyMs(System.currentTimeMillis() - start)
                    .message(result.message())
                    .failWindowIndex(result.index())
                    .inFailWindow(result.inWindow())
                    .build();

        } catch (Exception e) {
            SimulatedDownstream.SimulationResult lastRes = SimulatedDownstream.getLastResult();
            return ApiResponse.builder()
                    .ok(false)
                    .endpoint("profile")
                    .mode(mode)
                    .scenario(scenario)
                    .correlationId(correlationId)
                    .latencyMs(System.currentTimeMillis() - start)
                    .message(e.getMessage())
                    .failWindowIndex(lastRes != null ? lastRes.index() : null)
                    .inFailWindow(lastRes != null ? lastRes.inWindow() : false)
                    .build();
        }
    }
}

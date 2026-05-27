package com.hireblind.iam.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestLoggingFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final String MDC_KEY = "correlationId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            String method = httpRequest.getMethod();
            String uri = httpRequest.getRequestURI();
            String correlationId = MDC.get(MDC_KEY);
            long startTime = System.currentTimeMillis();

            log.info("Inbound Request: method={}, uri={}, correlationId={}", method, uri, correlationId);

            try {
                chain.doFilter(request, response);
            } finally {
                long duration = System.currentTimeMillis() - startTime;
                int status = httpResponse.getStatus();
                log.info("Outbound Response: method={}, uri={}, status={}, duration={}ms, correlationId={}",
                        method, uri, status, duration, correlationId);
            }
        } else {
            chain.doFilter(request, response);
        }
    }
}

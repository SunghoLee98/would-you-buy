package com.salaemalae.auth.security

import com.fasterxml.jackson.databind.ObjectMapper
import com.salaemalae.common.response.ErrorResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component

@Component
class JwtAuthenticationEntryPoint(
    private val objectMapper: ObjectMapper
) : AuthenticationEntryPoint {

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException
    ) {
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.status = HttpServletResponse.SC_UNAUTHORIZED

        val errorResponse = ErrorResponse(
            success = false,
            error = ErrorResponse.ErrorDetail(
                code = "UNAUTHORIZED",
                message = "인증이 필요합니다."
            )
        )

        response.writer.write(objectMapper.writeValueAsString(errorResponse))
    }
}
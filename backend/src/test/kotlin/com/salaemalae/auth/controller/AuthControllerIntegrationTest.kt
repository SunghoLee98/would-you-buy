package com.salaemalae.auth.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.salaemalae.auth.dto.LoginRequest
import com.salaemalae.auth.dto.RegisterRequest
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Test
    fun `should register new user successfully`() {
        val request = RegisterRequest(
            email = "newuser@test.com",
            password = "Test1234!",
            username = "newuser",
            termsAccepted = true
        )

        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("회원가입이 완료되었습니다."))
            .andExpect(jsonPath("$.data.email").value(request.email))
            .andExpect(jsonPath("$.data.username").value(request.username))
    }

    @Test
    fun `should return 400 when registering with invalid email format`() {
        val request = RegisterRequest(
            email = "invalid-email",
            password = "Test1234!",
            username = "testuser",
            termsAccepted = true
        )

        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
    }

    @Test
    fun `should return 400 when registering with weak password`() {
        val request = RegisterRequest(
            email = "test@test.com",
            password = "weak",
            username = "testuser",
            termsAccepted = true
        )

        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
    }

    @Test
    fun `should check email availability`() {
        mockMvc.perform(
            get("/api/v1/auth/check-email")
                .param("email", "available@test.com")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.available").value(true))
            .andExpect(jsonPath("$.data.message").value("사용 가능한 이메일입니다."))
    }

    @Test
    fun `should check username availability`() {
        mockMvc.perform(
            get("/api/v1/auth/check-username")
                .param("username", "availableuser")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.available").value(true))
            .andExpect(jsonPath("$.data.message").value("사용 가능한 닉네임입니다."))
    }

    @Test
    fun `should return 401 when accessing protected endpoint without token`() {
        mockMvc.perform(
            get("/api/v1/users/me")
        )
            .andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
    }

    @Test
    fun `health check should return UP status`() {
        mockMvc.perform(
            get("/api/v1/health")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.service").value("salae-malae-auth"))
    }
}
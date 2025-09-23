package com.salaemalae.common.response

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ErrorResponse(
    val success: Boolean = false,
    val error: ErrorDetail
) {
    data class ErrorDetail(
        val code: String,
        val message: String,
        val details: Map<String, String>? = null
    )
}
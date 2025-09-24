package com.salaemalae.voting.domain

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "stocks")
data class Stock(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @Column(unique = true, nullable = false, length = 20)
    val code: String,

    @Column(name = "korean_name", nullable = false, length = 100)
    val koreanName: String,

    @Column(name = "english_name", length = 100)
    val englishName: String? = null,

    @Column(name = "current_price", precision = 15, scale = 2)
    val currentPrice: BigDecimal? = null,

    @Column(name = "change_rate", precision = 8, scale = 4)
    val changeRate: BigDecimal? = null,

    @Column(name = "change_amount", precision = 15, scale = 2)
    val changeAmount: BigDecimal? = null,

    @Column(name = "is_primary")
    val isPrimary: Boolean = false,

    @Column(name = "is_active")
    val isActive: Boolean = true,

    @Column(name = "display_order")
    val displayOrder: Int = 0,

    @Column(name = "market_type", length = 20)
    val marketType: String = "KOSPI",

    @Column(name = "last_updated")
    val lastUpdated: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PreUpdate
    fun preUpdate() {
        updatedAt = LocalDateTime.now()
    }

    /**
     * Display name based on Korean market requirements
     */
    val displayName: String
        get() = koreanName

    /**
     * Check if stock price is increasing
     */
    fun isPriceIncreasing(): Boolean = changeAmount?.let { it > BigDecimal.ZERO } ?: false

    /**
     * Check if stock price is decreasing
     */
    fun isPriceDecreasing(): Boolean = changeAmount?.let { it < BigDecimal.ZERO } ?: false

    /**
     * Check if price data is stale (older than 5 minutes)
     */
    val isPriceStale: Boolean
        get() = lastUpdated?.let {
            LocalDateTime.now().minusMinutes(5).isAfter(it)
        } ?: true

    /**
     * Check if stock is eligible for voting
     */
    val isVotingEligible: Boolean
        get() = isActive && !isPriceStale

    /**
     * Get price trend direction
     */
    val priceTrend: PriceTrend
        get() = when {
            changeRate == null -> PriceTrend.NEUTRAL
            changeRate > BigDecimal.ZERO -> PriceTrend.UP
            changeRate < BigDecimal.ZERO -> PriceTrend.DOWN
            else -> PriceTrend.NEUTRAL
        }

    /**
     * Get formatted change rate as percentage string
     */
    fun getFormattedChangeRate(): String? {
        return changeRate?.let { rate ->
            val percentage = rate.multiply(BigDecimal(100))
            "${if (percentage >= BigDecimal.ZERO) "+" else ""}${percentage.setScale(2)}%"
        }
    }

    /**
     * Get formatted change amount with currency
     */
    fun getFormattedChangeAmount(): String? {
        return changeAmount?.let { amount ->
            "${if (amount >= BigDecimal.ZERO) "+" else ""}${amount.setScale(0)}원"
        }
    }

    companion object {
        const val KOSPI_CODE = "KOSPI"
        const val KOSDAQ_CODE = "KOSDAQ"
        const val MAX_PRICE_STALENESS_MINUTES = 5L

        /**
         * Create KOSPI index stock
         */
        fun createKospiIndex(): Stock {
            return Stock(
                code = KOSPI_CODE,
                koreanName = "코스피",
                englishName = "KOSPI",
                isPrimary = true,
                marketType = "INDEX",
                displayOrder = 1
            )
        }

        /**
         * Create major Korean stock
         */
        fun createMajorStock(
            code: String,
            koreanName: String,
            englishName: String? = null,
            displayOrder: Int = 10
        ): Stock {
            return Stock(
                code = code,
                koreanName = koreanName,
                englishName = englishName,
                isPrimary = false,
                marketType = "KOSPI",
                displayOrder = displayOrder
            )
        }
    }
}

/**
 * Enum representing price trend direction
 * Used for UI styling and trend analysis
 */
enum class PriceTrend {
    UP,      // Positive change rate
    DOWN,    // Negative change rate
    NEUTRAL  // Zero or null change rate
}
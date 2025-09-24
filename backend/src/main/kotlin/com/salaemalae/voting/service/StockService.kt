package com.salaemalae.voting.service

import com.salaemalae.common.exception.ApiException
import com.salaemalae.voting.domain.Stock
import com.salaemalae.voting.dto.StockInfoResponse
import com.salaemalae.voting.repository.StockRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.*

/**
 * Service for stock management and price operations
 *
 * Handles stock data management, price updates from external APIs,
 * and voting eligibility checks for Korean stocks.
 */
@Service
@Transactional(readOnly = true)
class StockService(
    private val stockRepository: StockRepository
) {
    private val logger = LoggerFactory.getLogger(StockService::class.java)

    /**
     * Get all active stocks for voting dashboard
     * Returns stocks ordered by primary flag (KOSPI first), then display order
     */
    fun getActiveStocksForVoting(): List<StockInfoResponse> {
        logger.debug("Fetching active stocks for voting dashboard")

        return stockRepository.findAllActiveStocksOrdered()
            .map { StockInfoResponse.from(it) }
            .also { stocks ->
                logger.info("Retrieved {} active stocks for voting", stocks.size)
            }
    }

    /**
     * Get stock by code
     * Returns stock information if exists and active
     */
    fun getStockByCode(code: String): StockInfoResponse {
        logger.debug("Fetching stock with code: {}", code)

        val stock = stockRepository.findByCode(code)
            .orElseThrow {
                ApiException("STOCK_NOT_FOUND", "주식을 찾을 수 없습니다: $code", HttpStatus.NOT_FOUND)
            }

        if (!stock.isActive) {
            throw ApiException("STOCK_INACTIVE", "비활성화된 주식입니다: $code", HttpStatus.BAD_REQUEST)
        }

        return StockInfoResponse.from(stock)
    }

    /**
     * Get primary stock (KOSPI index)
     * KOSPI is the main featured stock in the voting system
     */
    fun getPrimaryStock(): StockInfoResponse {
        logger.debug("Fetching primary stock (KOSPI)")

        val primaryStocks = stockRepository.findPrimaryStocks()

        if (primaryStocks.isEmpty()) {
            throw ApiException("PRIMARY_STOCK_NOT_FOUND", "주요 지수를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }

        val kospi = primaryStocks.first()
        logger.info("Retrieved primary stock: {} ({})", kospi.koreanName, kospi.code)

        return StockInfoResponse.from(kospi)
    }

    /**
     * Get featured stocks (non-primary stocks for voting)
     * Returns top stocks excluding KOSPI index
     */
    fun getFeaturedStocks(limit: Int = 10): List<StockInfoResponse> {
        logger.debug("Fetching featured stocks with limit: {}", limit)

        return stockRepository.findFeaturedStocks()
            .take(limit)
            .map { StockInfoResponse.from(it) }
            .also { stocks ->
                logger.info("Retrieved {} featured stocks", stocks.size)
            }
    }

    /**
     * Get voting eligible stocks
     * Returns stocks that are active and have recent price data
     */
    fun getVotingEligibleStocks(): List<StockInfoResponse> {
        logger.debug("Fetching voting eligible stocks")

        val freshThreshold = LocalDateTime.now().minusMinutes(Stock.MAX_PRICE_STALENESS_MINUTES)

        return stockRepository.findStocksNeedingUpdate(freshThreshold)
            .filter { it.isVotingEligible }
            .map { StockInfoResponse.from(it) }
            .also { stocks ->
                logger.info("Found {} voting eligible stocks", stocks.size)
            }
    }

    /**
     * Check if stock is eligible for voting
     * Validates stock exists, is active, and has fresh price data
     */
    fun isStockEligibleForVoting(stockCode: String): Boolean {
        logger.debug("Checking voting eligibility for stock: {}", stockCode)

        return try {
            val stock = stockRepository.findByCode(stockCode)
                .orElse(null) ?: return false

            val eligible = stock.isVotingEligible
            logger.debug("Stock {} voting eligibility: {}", stockCode, eligible)

            eligible
        } catch (e: Exception) {
            logger.warn("Error checking voting eligibility for stock {}: {}", stockCode, e.message)
            false
        }
    }

    /**
     * Get stocks by market type
     * Supports filtering by KOSPI, KOSDAQ, INDEX
     */
    fun getStocksByMarketType(marketType: String): List<StockInfoResponse> {
        logger.debug("Fetching stocks by market type: {}", marketType)

        return stockRepository.findByMarketType(marketType)
            .map { StockInfoResponse.from(it) }
            .also { stocks ->
                logger.info("Retrieved {} stocks for market type: {}", stocks.size, marketType)
            }
    }

    /**
     * Update stock price information
     * Called by external API integration or scheduled tasks
     */
    @Transactional
    fun updateStockPrice(
        stockCode: String,
        currentPrice: BigDecimal,
        changeRate: BigDecimal,
        changeAmount: BigDecimal
    ): StockInfoResponse {
        logger.debug("Updating price for stock: {} to {}", stockCode, currentPrice)

        val stock = stockRepository.findByCode(stockCode)
            .orElseThrow {
                ApiException("STOCK_NOT_FOUND", "주식을 찾을 수 없습니다: $stockCode", HttpStatus.NOT_FOUND)
            }

        val updatedStock = stock.copy(
            currentPrice = currentPrice,
            changeRate = changeRate,
            changeAmount = changeAmount,
            lastUpdated = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        stockRepository.save(updatedStock)

        logger.info("Updated price for stock {} ({}): {} ({}%)",
            stock.koreanName, stockCode, currentPrice, changeRate)

        return StockInfoResponse.from(updatedStock)
    }

    /**
     * Bulk update stock prices
     * Efficient batch update for multiple stocks from external API
     */
    @Transactional
    fun updateStockPrices(priceUpdates: Map<String, StockPriceUpdate>): List<StockInfoResponse> {
        logger.info("Bulk updating prices for {} stocks", priceUpdates.size)

        val stockCodes = priceUpdates.keys.toList()
        val stocks = stockRepository.findByCodeIn(stockCodes)

        val updatedStocks = stocks.map { stock ->
            val priceUpdate = priceUpdates[stock.code]
            if (priceUpdate != null) {
                stock.copy(
                    currentPrice = priceUpdate.currentPrice,
                    changeRate = priceUpdate.changeRate,
                    changeAmount = priceUpdate.changeAmount,
                    lastUpdated = LocalDateTime.now(),
                    updatedAt = LocalDateTime.now()
                )
            } else {
                stock
            }
        }

        stockRepository.saveAll(updatedStocks)

        logger.info("Successfully updated prices for {} stocks", updatedStocks.size)

        return updatedStocks.map { StockInfoResponse.from(it) }
    }

    /**
     * Get stocks that need price updates
     * Used by scheduled price update service
     */
    fun getStocksNeedingPriceUpdate(): List<StockInfoResponse> {
        logger.debug("Fetching stocks needing price updates")

        val updateThreshold = LocalDateTime.now().minusMinutes(Stock.MAX_PRICE_STALENESS_MINUTES)

        return stockRepository.findStocksNeedingUpdate(updateThreshold)
            .map { StockInfoResponse.from(it) }
            .also { stocks ->
                logger.info("Found {} stocks needing price updates", stocks.size)
            }
    }

    /**
     * Validate stock code format
     * Checks Korean stock code format (6 digits) or special codes (KOSPI)
     */
    fun validateStockCode(stockCode: String): Boolean {
        return when {
            stockCode == Stock.KOSPI_CODE -> true
            stockCode.matches(Regex("\\d{6}")) -> true  // 6-digit Korean stocks
            else -> false
        }
    }

    /**
     * Get system statistics
     * Returns overall stock system health and metrics
     */
    fun getSystemStatistics(): StockSystemStats {
        logger.debug("Calculating stock system statistics")

        val totalActive = stockRepository.countActiveStocks()
        val freshThreshold = LocalDateTime.now().minusMinutes(Stock.MAX_PRICE_STALENESS_MINUTES)
        val needingUpdate = stockRepository.findStocksNeedingUpdate(freshThreshold).size

        return StockSystemStats(
            totalActiveStocks = totalActive,
            stocksWithFreshData = totalActive - needingUpdate,
            stocksNeedingUpdate = needingUpdate,
            lastUpdateCheck = LocalDateTime.now()
        ).also { stats ->
            logger.info("Stock system stats: {} active, {} fresh, {} need update",
                stats.totalActiveStocks, stats.stocksWithFreshData, stats.stocksNeedingUpdate)
        }
    }

    companion object {
        /**
         * Default number of featured stocks to display
         */
        const val DEFAULT_FEATURED_STOCK_LIMIT = 10

    }
}

/**
 * Korean stock market operating hours
 */
object MarketHours {
    const val MARKET_OPEN_HOUR = 9
    const val MARKET_CLOSE_HOUR = 15
    const val MARKET_CLOSE_MINUTE = 30
}

/**
 * Data class for stock price updates
 */
data class StockPriceUpdate(
    val currentPrice: BigDecimal,
    val changeRate: BigDecimal,
    val changeAmount: BigDecimal
)

/**
 * Data class for stock system statistics
 */
data class StockSystemStats(
    val totalActiveStocks: Long,
    val stocksWithFreshData: Long,
    val stocksNeedingUpdate: Int,
    val lastUpdateCheck: LocalDateTime
) {
    val dataFreshnessRate: Double
        get() = if (totalActiveStocks > 0) {
            (stocksWithFreshData.toDouble() / totalActiveStocks) * 100
        } else 0.0
}
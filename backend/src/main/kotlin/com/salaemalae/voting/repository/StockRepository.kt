package com.salaemalae.voting.repository

import com.salaemalae.voting.domain.Stock
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface StockRepository : JpaRepository<Stock, UUID> {

    /**
     * Find stock by code
     */
    fun findByCode(code: String): Optional<Stock>

    /**
     * Find stocks by code list
     */
    fun findByCodeIn(codes: List<String>): List<Stock>

    /**
     * Find all active stocks ordered by display order
     */
    @Query("SELECT s FROM Stock s WHERE s.isActive = true ORDER BY s.displayOrder ASC, s.koreanName ASC")
    fun findAllActiveStocksOrdered(): List<Stock>

    /**
     * Find primary stocks (KOSPI index)
     */
    @Query("SELECT s FROM Stock s WHERE s.isPrimary = true AND s.isActive = true ORDER BY s.displayOrder ASC")
    fun findPrimaryStocks(): List<Stock>

    /**
     * Find featured stocks for voting (non-primary, active stocks)
     */
    @Query("SELECT s FROM Stock s WHERE s.isPrimary = false AND s.isActive = true ORDER BY s.displayOrder ASC, s.koreanName ASC")
    fun findFeaturedStocks(): List<Stock>

    /**
     * Find stocks by market type
     */
    @Query("SELECT s FROM Stock s WHERE s.marketType = :marketType AND s.isActive = true ORDER BY s.displayOrder ASC")
    fun findByMarketType(@Param("marketType") marketType: String): List<Stock>

    /**
     * Find stocks for daily voting (primary + top featured stocks)
     */
    @Query("""
        SELECT s FROM Stock s
        WHERE s.isActive = true
        AND (s.isPrimary = true OR s.displayOrder <= :maxFeaturedStocks)
        ORDER BY s.isPrimary DESC, s.displayOrder ASC
    """)
    fun findDailyVotingStocks(@Param("maxFeaturedStocks") maxFeaturedStocks: Int = 10): List<Stock>

    /**
     * Check if stock exists by code
     */
    fun existsByCode(code: String): Boolean

    /**
     * Find KOSPI index stock
     */
    @Query("SELECT s FROM Stock s WHERE s.code = 'KOSPI' AND s.isActive = true")
    fun findKospiIndex(): Optional<Stock>

    /**
     * Find stocks that need price updates (older than specified minutes)
     */
    @Query("""
        SELECT s FROM Stock s
        WHERE s.isActive = true
        AND (s.lastUpdated IS NULL OR s.lastUpdated < :cutoffTime)
        ORDER BY s.isPrimary DESC, s.displayOrder ASC
    """)
    fun findStocksNeedingUpdate(@Param("cutoffTime") cutoffTime: java.time.LocalDateTime): List<Stock>

    /**
     * Count total active stocks
     */
    @Query("SELECT COUNT(s) FROM Stock s WHERE s.isActive = true")
    fun countActiveStocks(): Long

    /**
     * Find stocks by Korean name (for search functionality)
     */
    @Query("SELECT s FROM Stock s WHERE s.koreanName LIKE %:name% AND s.isActive = true ORDER BY s.displayOrder ASC")
    fun findByKoreanNameContaining(@Param("name") name: String): List<Stock>
}
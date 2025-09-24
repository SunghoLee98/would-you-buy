package com.salaemalae.voting.repository

import com.salaemalae.auth.domain.User
import com.salaemalae.voting.domain.Vote
import com.salaemalae.voting.domain.VoteType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.*

@Repository
interface VoteRepository : JpaRepository<Vote, UUID> {

    /**
     * Find vote by user, stock code, and voting date
     */
    fun findByUserAndStockCodeAndVotingDate(
        user: User,
        stockCode: String,
        votingDate: LocalDate
    ): Optional<Vote>

    /**
     * Find all votes by user for a specific date
     */
    @Query("SELECT v FROM Vote v WHERE v.user = :user AND v.votingDate = :votingDate ORDER BY v.createdAt ASC")
    fun findByUserAndVotingDate(
        @Param("user") user: User,
        @Param("votingDate") votingDate: LocalDate
    ): List<Vote>

    /**
     * Find all votes for a specific stock and date
     */
    @Query("SELECT v FROM Vote v WHERE v.stockCode = :stockCode AND v.votingDate = :votingDate")
    fun findByStockCodeAndVotingDate(
        @Param("stockCode") stockCode: String,
        @Param("votingDate") votingDate: LocalDate
    ): List<Vote>

    /**
     * Count votes by type for a specific stock and date
     */
    @Query("""
        SELECT v.voteType, COUNT(v)
        FROM Vote v
        WHERE v.stockCode = :stockCode AND v.votingDate = :votingDate
        GROUP BY v.voteType
    """)
    fun countVotesByTypeForStockAndDate(
        @Param("stockCode") stockCode: String,
        @Param("votingDate") votingDate: LocalDate
    ): List<Array<Any>>

    /**
     * Get vote statistics for a stock on a specific date
     */
    @Query("""
        SELECT
            COUNT(CASE WHEN v.voteType = 'UP' THEN 1 END) as upVotes,
            COUNT(CASE WHEN v.voteType = 'DOWN' THEN 1 END) as downVotes,
            COUNT(*) as totalVotes
        FROM Vote v
        WHERE v.stockCode = :stockCode AND v.votingDate = :votingDate
    """)
    fun getVoteStatistics(
        @Param("stockCode") stockCode: String,
        @Param("votingDate") votingDate: LocalDate
    ): Array<Any>

    /**
     * Find user's voting history
     */
    @Query("SELECT v FROM Vote v WHERE v.user = :user ORDER BY v.votingDate DESC, v.createdAt DESC")
    fun findUserVotingHistory(@Param("user") user: User): List<Vote>

    /**
     * Find user's voting history with pagination
     */
    @Query("SELECT v FROM Vote v WHERE v.user = :user ORDER BY v.votingDate DESC, v.createdAt DESC")
    fun findUserVotingHistory(
        @Param("user") user: User,
        pageable: org.springframework.data.domain.Pageable
    ): org.springframework.data.domain.Page<Vote>

    /**
     * Find votes that need result calculation
     */
    @Query("""
        SELECT v FROM Vote v
        WHERE v.isResultCalculated = false
        AND v.votingDate < :currentDate
        ORDER BY v.votingDate ASC
    """)
    fun findVotesNeedingResultCalculation(@Param("currentDate") currentDate: LocalDate): List<Vote>

    /**
     * Find votes for a specific date that need result calculation
     */
    @Query("""
        SELECT v FROM Vote v
        WHERE v.isResultCalculated = false
        AND v.votingDate = :targetDate
    """)
    fun findVotesForDateNeedingCalculation(@Param("targetDate") targetDate: LocalDate): List<Vote>

    /**
     * Check if user has voted for a stock on a specific date
     */
    fun existsByUserAndStockCodeAndVotingDate(
        user: User,
        stockCode: String,
        votingDate: LocalDate
    ): Boolean

    /**
     * Count total votes by user
     */
    @Query("SELECT COUNT(v) FROM Vote v WHERE v.user = :user")
    fun countVotesByUser(@Param("user") user: User): Long

    /**
     * Count correct votes by user
     */
    @Query("SELECT COUNT(v) FROM Vote v WHERE v.user = :user AND v.isCorrect = true")
    fun countCorrectVotesByUser(@Param("user") user: User): Long

    /**
     * Get user's current streak of correct predictions
     */
    @Query("""
        SELECT v FROM Vote v
        WHERE v.user = :user
        AND v.isResultCalculated = true
        ORDER BY v.votingDate DESC
    """)
    fun findRecentCalculatedVotesByUser(@Param("user") user: User): List<Vote>

    /**
     * Find top performers for a specific date
     */
    @Query("""
        SELECT v.user, COUNT(v) as totalVotes, COUNT(CASE WHEN v.isCorrect = true THEN 1 END) as correctVotes
        FROM Vote v
        WHERE v.votingDate = :date AND v.isResultCalculated = true
        GROUP BY v.user
        HAVING COUNT(v) > 0
        ORDER BY (COUNT(CASE WHEN v.isCorrect = true THEN 1 END) * 1.0 / COUNT(v)) DESC, COUNT(v) DESC
    """)
    fun findTopPerformersForDate(@Param("date") date: LocalDate): List<Array<Any>>

    /**
     * Get community voting percentages for a stock on a date
     */
    @Query("""
        SELECT
            v.voteType,
            COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Vote v2 WHERE v2.stockCode = :stockCode AND v2.votingDate = :date) as percentage
        FROM Vote v
        WHERE v.stockCode = :stockCode AND v.votingDate = :date
        GROUP BY v.voteType
    """)
    fun getCommunityVotingPercentages(
        @Param("stockCode") stockCode: String,
        @Param("date") date: LocalDate
    ): List<Array<Any>>

    /**
     * Find votes by stock code and date range
     */
    @Query("""
        SELECT v FROM Vote v
        WHERE v.stockCode = :stockCode
        AND v.votingDate BETWEEN :startDate AND :endDate
        ORDER BY v.votingDate DESC
    """)
    fun findByStockCodeAndDateRange(
        @Param("stockCode") stockCode: String,
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<Vote>
}
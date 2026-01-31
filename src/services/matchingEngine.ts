import { sql } from '@/lib/db';
import { compareAttributes, calculateTextSimilarity } from '@/lib/textSimilarity';
import { compareImageSets } from '@/lib/imageSimilarity';
import { createNotification } from './notificationService';

// ==================== Configuration ====================

const ENGINE_CONFIG = {
    WEIGHTS: {
        TEXT: 0.25,      // Increased slightly
        LOCATION: 0.20,
        TIME: 0.10,
        IMAGE: 0.45      // Description & Visual combined
    },
    THRESHOLDS: {
        MIN_MATCH: 0.50, // 50% Hard Requirement
        HIGH_MATCH: 0.80
    }
};

interface MatchResult {
    score: number;
    details: {
        text: number;
        image: number;
        location: number;
        time: number;
    };
}

// ==================== Core Logic ====================

/**
 * The New V2 Matching Engine
 * Guaranteed to run on every report creation/update.
 */
export const MatchingEngine = {

    /**
     * Main Entry Point: Trigger matching for a specific report
     */
    async run(reportId: string): Promise<void> {
        console.log(`🚀 [MatchingEngine] Started for Report ID: ${reportId}`);

        try {
            // 1. Fetch Target Report
            const reports = await sql`
                SELECT r.*, 
                    ARRAY(SELECT image_url FROM report_images WHERE report_id = r.id) as images,
                    ARRAY(SELECT description_ai FROM report_images WHERE report_id = r.id AND description_ai IS NOT NULL) as image_descriptions
                FROM reports r WHERE r.id = ${reportId}
            `;

            if (reports.length === 0) {
                console.warn(`⚠️ [MatchingEngine] Report not found: ${reportId}`);
                return;
            }

            const target = reports[0];
            const targetType = target.type; // 'lost' or 'found'
            const candidateType = targetType === 'lost' ? 'found' : 'lost';

            // 2. Fetch Candidates (Opposite Type)
            // We fetch ALL candidates pending/processing for maximum coverage
            const candidates = await sql`
                SELECT r.*, 
                    ARRAY(SELECT image_url FROM report_images WHERE report_id = r.id) as images,
                    ARRAY(SELECT description_ai FROM report_images WHERE report_id = r.id AND description_ai IS NOT NULL) as image_descriptions
                FROM reports r 
                WHERE r.type = ${candidateType}
                AND r.status IN ('pending', 'processing', 'matched') 
                AND r.id != ${reportId}
            `;

            console.log(`🔍 [MatchingEngine] Found ${candidates.length} candidates for comparison.`);

            let matchCount = 0;

            // 3. Iterate and Score
            for (const candidate of candidates) {
                const scoreResult = await this.calculateScore(target, candidate);

                if (scoreResult.score >= ENGINE_CONFIG.THRESHOLDS.MIN_MATCH) {
                    await this.handleMatchFound(target, candidate, scoreResult);
                    matchCount++;
                }
            }

            console.log(`✅ [MatchingEngine] Completed. Matches found: ${matchCount}`);

        } catch (error) {
            console.error('🔥 [MatchingEngine] CRITICAL FAILURE:', error);
            await this.alertSystemFailure(reportId, error);
        }
    },

    /**
     * Scoring Algorithm
     */
    async calculateScore(target: any, candidate: any): Promise<MatchResult> {
        // A. Category Filter (Hard Filter)
        if (target.category !== candidate.category && target.category !== 'other' && candidate.category !== 'other') {
            return { score: 0, details: { text: 0, image: 0, location: 0, time: 0 } };
        }

        // B. Text Similarity
        const textScore = compareAttributes(
            {
                title: target.title,
                description: target.description,
                color: target.color,
                category: target.category
            },
            {
                title: candidate.title,
                description: candidate.description,
                color: candidate.color,
                category: candidate.category
            }
        );

        // C. Location Similarity
        let locationScore = 0;
        if (target.location_city === candidate.location_city) {
            locationScore = 0.8; // Same city = good baseline
            // If GPS available, refine
            if (target.location_lat && candidate.location_lat) {
                const dist = this.calculateDistance(target.location_lat, target.location_lng, candidate.location_lat, candidate.location_lng);
                if (dist < 5) locationScore = 1.0;
                else if (dist < 20) locationScore = 0.9;
                else if (dist > 100) locationScore = 0.5;
            }
        }

        // D. Time Similarity
        let timeScore = 0;
        const d1 = new Date(target.date_occurred);
        const d2 = new Date(candidate.date_occurred);
        const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);

        if (diffDays <= 2) timeScore = 1.0;
        else if (diffDays <= 7) timeScore = 0.8;
        else if (diffDays <= 30) timeScore = 0.5;
        else timeScore = 0.2;

        // E. Image Similarity
        let imageScore = 0;
        // 1. AI Text Description Match (Preferred)
        const tDesc = (target.image_descriptions || []).join(' ');
        const cDesc = (candidate.image_descriptions || []).join(' ');

        if (tDesc.trim() && cDesc.trim()) {
            imageScore = calculateTextSimilarity(tDesc, cDesc).overall;
        } else {
            // 2. Visual Match (Fallback)
            const tImages = target.images || [];
            const cImages = candidate.images || [];
            if (tImages.length > 0 && cImages.length > 0) {
                imageScore = await compareImageSets(tImages, cImages);
            }
        }

        // Final Weighted Score
        const totalScore = (
            (textScore * ENGINE_CONFIG.WEIGHTS.TEXT) +
            (locationScore * ENGINE_CONFIG.WEIGHTS.LOCATION) +
            (timeScore * ENGINE_CONFIG.WEIGHTS.TIME) +
            (imageScore * ENGINE_CONFIG.WEIGHTS.IMAGE)
        );

        return {
            score: Number(totalScore.toFixed(2)),
            details: {
                text: textScore,
                location: locationScore,
                time: timeScore,
                image: imageScore
            }
        };
    },

    /**
     * Actions on Match Found
     */
    async handleMatchFound(target: any, candidate: any, result: MatchResult) {
        const lostId = target.type === 'lost' ? target.id : candidate.id;
        const foundId = target.type === 'found' ? target.id : candidate.id;

        // 1. Insert into DB (Idempotent)
        const existing = await sql`
            SELECT id FROM ai_matches 
            WHERE lost_report_id = ${lostId} AND found_report_id = ${foundId}
        `;

        let matchId;

        if (existing.length === 0) {
            const insert = await sql`
                INSERT INTO ai_matches (
                    lost_report_id, found_report_id, 
                    final_score, image_score, text_score, location_score, time_score, 
                    status
                ) VALUES (
                    ${lostId}, ${foundId},
                    ${result.score}, ${result.details.image}, ${result.details.text}, 
                    ${result.details.location}, ${result.details.time},
                    'pending'
                )
                RETURNING id
            `;
            matchId = insert[0].id;
            console.log(`✨ [MatchingEngine] New Match Created: ${matchId} (Score: ${result.score})`);
        } else {
            matchId = existing[0].id;
            await sql`
                UPDATE ai_matches SET
                    final_score = ${result.score},
                    image_score = ${result.details.image},
                    text_score = ${result.details.text},
                    updated_at = NOW()
                WHERE id = ${matchId}
            `;
            console.log(`🔄 [MatchingEngine] Match Updated: ${matchId}`);
        }

        // 2. Send Notifications (Admin/Supervisor)
        // Rate Limit: Don't notify if we notified for this matchId in the last hour
        const cooldown = await sql`
            SELECT id FROM notifications 
            WHERE related_match_id = ${matchId} 
            AND created_at > NOW() - INTERVAL '1 hour'
        `;

        if (cooldown.length === 0) {
            await this.notifyAdmins(matchId, target, candidate, result.score);
        }
    },

    async notifyAdmins(matchId: string, r1: any, r2: any, score: number) {
        const admins = await sql`SELECT id FROM users WHERE role IN ('admin', 'moderator')`;

        for (const admin of admins) {
            await createNotification({
                user_id: admin.id,
                title: 'notif_match_potential_title',
                message: JSON.stringify({
                    key: 'notif_match_potential_msg',
                    params: {
                        score: Math.round(score * 100),
                        lostTitle: r1.type === 'lost' ? r1.title : r2.title,
                        foundTitle: r1.type === 'found' ? r1.title : r2.title
                    }
                }),
                type: 'match',
                related_match_id: matchId
            });
        }
        console.log(`📢 [MatchingEngine] Notifications sent to ${admins.length} admins.`);
    },

    /**
     * System Failure Helpers
     */
    async alertSystemFailure(reportId: string, error: any) {
        // Find Admins
        const admins = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
        if (admins.length === 0) return;
        const adminId = admins[0].id;

        // Dedup: Check if alerted recently for system failure
        const recentAlerts = await sql`
            SELECT id FROM notifications 
            WHERE user_id = ${adminId} 
            AND type = 'system' 
            AND created_at > NOW() - INTERVAL '30 minutes'
        `;

        if (recentAlerts.length === 0) {
            await createNotification({
                user_id: adminId,
                title: 'System Failure: Matching Engine',
                message: `Failed to process report ${reportId}. Error: ${String(error).substring(0, 100)}`,
                type: 'system'
            });
        }
    },

    /**
     * Utilities
     */
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};

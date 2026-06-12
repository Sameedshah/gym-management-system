-- =====================================================
-- GYM MANAGEMENT SYSTEM - VIEWS AND REPORTS
-- =====================================================
-- Run this script after inserting sample data
-- This creates useful views and stored procedures for reports

-- =====================================================
-- MEMBER DASHBOARD VIEW
-- =====================================================
CREATE OR REPLACE VIEW member_dashboard AS
SELECT 
    m.id,
    m.member_id,
    m.name,
    m.email,
    m.phone,
    m.membership_type,
    m.plan_name,
    m.monthly_fee,
    m.status,
    m.join_date,
    m.membership_start,
    m.membership_end,
    m.last_seen,
    m.total_visits,
    
    -- Payment status
    COALESCE(pending_invoices.pending_amount, 0) as pending_amount,
    COALESCE(pending_invoices.overdue_amount, 0) as overdue_amount,
    COALESCE(pending_invoices.total_pending, 0) as total_pending,
    
    -- Recent activity
    recent_checkin.last_checkin,
    recent_checkin.days_since_last_visit,
    
    -- Membership status
    CASE 
        WHEN m.membership_end < CURRENT_DATE THEN 'Expired'
        WHEN m.membership_end <= CURRENT_DATE + INTERVAL '7 days' THEN 'Expiring Soon'
        WHEN COALESCE(pending_invoices.overdue_amount, 0) > 0 THEN 'Payment Overdue'
        WHEN m.status = 'suspended' THEN 'Suspended'
        ELSE 'Active'
    END as membership_status
    
FROM public.members m

-- Pending payments subquery
LEFT JOIN (
    SELECT 
        member_id,
        SUM(CASE WHEN status = 'due' THEN amount + late_fee ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'overdue' THEN amount + late_fee ELSE 0 END) as overdue_amount,
        SUM(CASE WHEN status IN ('due', 'overdue') THEN amount + late_fee ELSE 0 END) as total_pending
    FROM public.invoices 
    WHERE status IN ('due', 'overdue')
    GROUP BY member_id
) pending_invoices ON m.id = pending_invoices.member_id

-- Recent check-in subquery
LEFT JOIN (
    SELECT 
        member_id,
        MAX(check_in_time) as last_checkin,
        EXTRACT(DAY FROM NOW() - MAX(check_in_time)) as days_since_last_visit
    FROM public.checkins
    GROUP BY member_id
) recent_checkin ON m.id = recent_checkin.member_id;

-- =====================================================
-- FINANCIAL SUMMARY VIEW
-- =====================================================
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    -- Current month revenue
    COALESCE(current_month.total_revenue, 0) as current_month_revenue,
    COALESCE(current_month.paid_invoices, 0) as current_month_paid_invoices,
    
    -- Previous month revenue
    COALESCE(previous_month.total_revenue, 0) as previous_month_revenue,
    COALESCE(previous_month.paid_invoices, 0) as previous_month_paid_invoices,
    
    -- Outstanding amounts
    COALESCE(outstanding.total_due, 0) as total_outstanding,
    COALESCE(outstanding.total_overdue, 0) as total_overdue,
    COALESCE(outstanding.due_invoices, 0) as outstanding_invoices_count,
    
    -- Year to date
    COALESCE(ytd.total_revenue, 0) as ytd_revenue,
    COALESCE(ytd.paid_invoices, 0) as ytd_paid_invoices,
    
    -- Growth calculation
    CASE 
        WHEN COALESCE(previous_month.total_revenue, 0) > 0 THEN
            ROUND(((COALESCE(current_month.total_revenue, 0) - COALESCE(previous_month.total_revenue, 0)) / COALESCE(previous_month.total_revenue, 0)) * 100, 2)
        ELSE 0
    END as month_over_month_growth

FROM (SELECT 1) dummy

-- Current month revenue
LEFT JOIN (
    SELECT 
        SUM(ph.amount) as total_revenue,
        COUNT(*) as paid_invoices
    FROM public.payment_history ph
    WHERE DATE_TRUNC('month', ph.payment_date) = DATE_TRUNC('month', CURRENT_DATE)
) current_month ON true

-- Previous month revenue
LEFT JOIN (
    SELECT 
        SUM(ph.amount) as total_revenue,
        COUNT(*) as paid_invoices
    FROM public.payment_history ph
    WHERE DATE_TRUNC('month', ph.payment_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
) previous_month ON true

-- Outstanding amounts
LEFT JOIN (
    SELECT 
        SUM(CASE WHEN status = 'due' THEN amount + late_fee ELSE 0 END) as total_due,
        SUM(CASE WHEN status = 'overdue' THEN amount + late_fee ELSE 0 END) as total_overdue,
        COUNT(*) as due_invoices
    FROM public.invoices
    WHERE status IN ('due', 'overdue')
) outstanding ON true

-- Year to date revenue
LEFT JOIN (
    SELECT 
        SUM(ph.amount) as total_revenue,
        COUNT(*) as paid_invoices
    FROM public.payment_history ph
    WHERE EXTRACT(YEAR FROM ph.payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
) ytd ON true;

-- =====================================================
-- MEMBER ACTIVITY VIEW
-- =====================================================
CREATE OR REPLACE VIEW member_activity_summary AS
SELECT 
    m.id,
    m.member_id,
    m.name,
    m.membership_type,
    m.plan_name,
    m.status,
    
    -- Visit statistics
    COALESCE(visit_stats.total_visits, 0) as total_visits,
    COALESCE(visit_stats.visits_this_month, 0) as visits_this_month,
    COALESCE(visit_stats.visits_last_month, 0) as visits_last_month,
    COALESCE(visit_stats.avg_duration_minutes, 0) as avg_workout_duration,
    
    -- Last activity
    visit_stats.last_visit,
    visit_stats.days_since_last_visit,
    
    -- Activity level classification
    CASE 
        WHEN visit_stats.days_since_last_visit IS NULL THEN 'Never Visited'
        WHEN visit_stats.days_since_last_visit > 30 THEN 'Inactive'
        WHEN visit_stats.days_since_last_visit > 14 THEN 'Low Activity'
        WHEN visit_stats.days_since_last_visit > 7 THEN 'Moderate Activity'
        ELSE 'High Activity'
    END as activity_level

FROM public.members m

LEFT JOIN (
    SELECT 
        member_id,
        COUNT(*) as total_visits,
        COUNT(CASE WHEN check_in_time >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as visits_this_month,
        COUNT(CASE WHEN check_in_time >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                   AND check_in_time < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as visits_last_month,
        AVG(duration_minutes) as avg_duration_minutes,
        MAX(check_in_time) as last_visit,
        EXTRACT(DAY FROM NOW() - MAX(check_in_time)) as days_since_last_visit
    FROM public.checkins
    GROUP BY member_id
) visit_stats ON m.id = visit_stats.member_id;

-- =====================================================
-- OVERDUE PAYMENTS VIEW
-- =====================================================
CREATE OR REPLACE VIEW overdue_payments AS
SELECT 
    i.id as invoice_id,
    i.invoice_number,
    m.member_id,
    m.name as member_name,
    m.email,
    m.phone,
    i.amount,
    i.late_fee,
    (i.amount + i.late_fee) as total_amount,
    i.due_date,
    i.invoice_month,
    i.description,
    EXTRACT(DAY FROM CURRENT_DATE - i.due_date) as days_overdue,
    i.reminder_count,
    i.last_reminder_sent,
    i.sms_sent,
    i.email_sent,
    
    -- Risk classification
    CASE 
        WHEN EXTRACT(DAY FROM CURRENT_DATE - i.due_date) > 60 THEN 'High Risk'
        WHEN EXTRACT(DAY FROM CURRENT_DATE - i.due_date) > 30 THEN 'Medium Risk'
        ELSE 'Low Risk'
    END as risk_level

FROM public.invoices i
JOIN public.members m ON i.member_id = m.id
WHERE i.status = 'overdue'
ORDER BY i.due_date ASC;

-- =====================================================
-- MEMBERSHIP EXPIRY VIEW
-- =====================================================
CREATE OR REPLACE VIEW membership_expiry AS
SELECT 
    m.id,
    m.member_id,
    m.name,
    m.email,
    m.phone,
    m.membership_type,
    m.plan_name,
    m.membership_end,
    EXTRACT(DAY FROM m.membership_end - CURRENT_DATE) as days_until_expiry,
    
    -- Expiry status
    CASE 
        WHEN m.membership_end < CURRENT_DATE THEN 'Expired'
        WHEN m.membership_end <= CURRENT_DATE + INTERVAL '7 days' THEN 'Expires This Week'
        WHEN m.membership_end <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expires This Month'
        ELSE 'Active'
    END as expiry_status,
    
    -- Last payment
    last_payment.payment_date as last_payment_date,
    last_payment.amount as last_payment_amount

FROM public.members m

LEFT JOIN (
    SELECT 
        ph.member_id,
        ph.payment_date,
        ph.amount,
        ROW_NUMBER() OVER (PARTITION BY ph.member_id ORDER BY ph.payment_date DESC) as rn
    FROM public.payment_history ph
) last_payment ON m.id = last_payment.member_id AND last_payment.rn = 1

WHERE m.membership_end IS NOT NULL
ORDER BY m.membership_end ASC;

-- =====================================================
-- DAILY ATTENDANCE VIEW
-- =====================================================
CREATE OR REPLACE VIEW daily_attendance AS
SELECT 
    DATE(check_in_time) as attendance_date,
    COUNT(DISTINCT member_id) as unique_visitors,
    COUNT(*) as total_checkins,
    AVG(duration_minutes) as avg_workout_duration,
    
    -- Peak hours
    COUNT(CASE WHEN EXTRACT(HOUR FROM check_in_time) BETWEEN 6 AND 10 THEN 1 END) as morning_visits,
    COUNT(CASE WHEN EXTRACT(HOUR FROM check_in_time) BETWEEN 11 AND 16 THEN 1 END) as afternoon_visits,
    COUNT(CASE WHEN EXTRACT(HOUR FROM check_in_time) BETWEEN 17 AND 22 THEN 1 END) as evening_visits,
    
    -- Day of week
    TO_CHAR(check_in_time, 'Day') as day_of_week

FROM public.checkins
WHERE check_in_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(check_in_time), TO_CHAR(check_in_time, 'Day')
ORDER BY attendance_date DESC;

-- =====================================================
-- STORED PROCEDURES FOR REPORTS
-- =====================================================

-- Function to get member payment history
CREATE OR REPLACE FUNCTION get_member_payment_history(member_uuid UUID)
RETURNS TABLE (
    invoice_number TEXT,
    amount DECIMAL(10,2),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    transaction_id TEXT,
    invoice_month DATE,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.invoice_number,
        ph.amount,
        ph.payment_date,
        ph.payment_method,
        ph.transaction_id,
        i.invoice_month,
        i.status
    FROM public.payment_history ph
    JOIN public.invoices i ON ph.invoice_id = i.id
    WHERE ph.member_id = member_uuid
    ORDER BY ph.payment_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly revenue report
CREATE OR REPLACE FUNCTION get_monthly_revenue_report(report_year INTEGER, report_month INTEGER)
RETURNS TABLE (
    total_revenue DECIMAL(10,2),
    total_payments INTEGER,
    avg_payment DECIMAL(10,2),
    payment_methods JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ph.amount), 0) as total_revenue,
        COUNT(*)::INTEGER as total_payments,
        COALESCE(AVG(ph.amount), 0) as avg_payment,
        COALESCE(
            jsonb_object_agg(
                ph.payment_method, 
                payment_counts.method_count
            ), 
            '{}'::jsonb
        ) as payment_methods
    FROM public.payment_history ph
    LEFT JOIN (
        SELECT 
            payment_method,
            COUNT(*) as method_count
        FROM public.payment_history
        WHERE EXTRACT(YEAR FROM payment_date) = report_year
        AND EXTRACT(MONTH FROM payment_date) = report_month
        GROUP BY payment_method
    ) payment_counts ON ph.payment_method = payment_counts.payment_method
    WHERE EXTRACT(YEAR FROM ph.payment_date) = report_year
    AND EXTRACT(MONTH FROM ph.payment_date) = report_month;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS ON VIEWS
-- =====================================================
GRANT SELECT ON member_dashboard TO anon, authenticated;
GRANT SELECT ON financial_summary TO anon, authenticated;
GRANT SELECT ON member_activity_summary TO anon, authenticated;
GRANT SELECT ON overdue_payments TO anon, authenticated;
GRANT SELECT ON membership_expiry TO anon, authenticated;
GRANT SELECT ON daily_attendance TO anon, authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Views and reports created successfully!' as message;
SELECT 'Available views: member_dashboard, financial_summary, member_activity_summary, overdue_payments, membership_expiry, daily_attendance' as available_views;
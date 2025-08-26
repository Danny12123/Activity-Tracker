-- Insert sample activities for demonstration of how the system works
INSERT INTO public.activities (title, description, category) VALUES
('Daily SMS count in comparison to SMS count from logs', 'Compare SMS counts between system reports and actual logs to identify discrepancies', 'Monitoring'),
('Database backup verification', 'Verify that all scheduled database backups completed successfully', 'Maintenance'),
('API response time monitoring', 'Monitor API endpoints for response time degradation and performance issues', 'Performance'),
('User authentication logs review', 'Review authentication logs for suspicious activities or failed login attempts', 'Security'),
('System resource utilization check', 'Monitor CPU, memory, and disk usage across all production servers', 'Monitoring'),
('Application error log analysis', 'Analyze application error logs for recurring issues and patterns', 'Troubleshooting'),
('Third-party service integration status', 'Check status and connectivity of all third-party service integrations', 'Integration'),
('Data synchronization verification', 'Verify data synchronization between primary and backup systems', 'Data Management');

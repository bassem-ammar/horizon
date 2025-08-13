-- Insert sample admin user (password: admin123)
-- Note: In production, use a stronger password and hash it properly
INSERT INTO admin_users (email, password_hash, name) VALUES 
('admin@horizonswtc.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqO', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Insert sample alimentary products
INSERT INTO products (name, description, category, price, image_url, specifications, is_featured, stock_quantity, sales_count) VALUES 
('Premium Olive Oil', 'Extra virgin olive oil from Mediterranean regions', 'alimentary', 25.99, '/placeholder.svg?height=300&width=300&text=Olive+Oil', '{"origin": "Mediterranean", "volume": "500ml", "grade": "Extra Virgin"}', true, 500, 150),
('Organic Wheat Flour', 'High-quality organic wheat flour for baking', 'alimentary', 12.50, '/placeholder.svg?height=300&width=300&text=Wheat+Flour', '{"type": "Organic", "weight": "25kg", "protein": "12%"}', true, 200, 89),
('Premium Coffee Beans', 'Arabica coffee beans from South America', 'alimentary', 35.00, '/placeholder.svg?height=300&width=300&text=Coffee+Beans', '{"origin": "Colombia", "roast": "Medium", "weight": "1kg"}', false, 300, 67),
('Basmati Rice', 'Long grain basmati rice from India', 'alimentary', 18.75, '/placeholder.svg?height=300&width=300&text=Basmati+Rice', '{"origin": "India", "grade": "Premium", "weight": "20kg"}', true, 400, 120),
('Organic Quinoa', 'Premium organic quinoa from Bolivia', 'alimentary', 28.50, '/placeholder.svg?height=300&width=300&text=Quinoa', '{"origin": "Bolivia", "type": "Organic", "weight": "10kg"}', false, 150, 45),
('Extra Virgin Coconut Oil', 'Cold-pressed coconut oil from Philippines', 'alimentary', 22.00, '/placeholder.svg?height=300&width=300&text=Coconut+Oil', '{"origin": "Philippines", "type": "Cold-pressed", "volume": "1L"}', true, 300, 78)
ON CONFLICT DO NOTHING;

-- Insert sample gas & oil products
INSERT INTO products (name, description, category, price, image_url, specifications, is_featured, stock_quantity, sales_count) VALUES 
('Crude Oil WTI', 'West Texas Intermediate crude oil', 'gas_oil', 75.50, '/placeholder.svg?height=300&width=300&text=Crude+Oil', '{"grade": "WTI", "sulfur_content": "0.24%", "unit": "barrel"}', true, 1000, 45),
('Natural Gas', 'High-quality natural gas for industrial use', 'gas_oil', 3.25, '/placeholder.svg?height=300&width=300&text=Natural+Gas', '{"purity": "99.5%", "pressure": "1000 PSI", "unit": "MMBtu"}', true, 2000, 78),
('Diesel Fuel', 'Ultra-low sulfur diesel fuel', 'gas_oil', 2.85, '/placeholder.svg?height=300&width=300&text=Diesel+Fuel', '{"sulfur_content": "15ppm", "cetane_number": "45", "unit": "gallon"}', false, 5000, 234),
('Gasoline Premium', 'High octane premium gasoline', 'gas_oil', 3.15, '/placeholder.svg?height=300&width=300&text=Premium+Gas', '{"octane_rating": "93", "ethanol_content": "10%", "unit": "gallon"}', true, 3000, 189),
('Heating Oil', 'Clean burning heating oil for residential use', 'gas_oil', 2.95, '/placeholder.svg?height=300&width=300&text=Heating+Oil', '{"sulfur_content": "15ppm", "flash_point": "38°C", "unit": "gallon"}', false, 2500, 156),
('Jet Fuel A1', 'Aviation turbine fuel for commercial aircraft', 'gas_oil', 4.20, '/placeholder.svg?height=300&width=300&text=Jet+Fuel', '{"grade": "A1", "freezing_point": "-47°C", "unit": "gallon"}', true, 1500, 92)
ON CONFLICT DO NOTHING;

-- Insert sample contact submissions
INSERT INTO contact_submissions (name, email, phone, message, status) VALUES 
('John Smith', 'john.smith@example.com', '+1-555-0123', 'Interested in your olive oil products. Please send me more information about bulk pricing.', 'new'),
('Maria Garcia', 'maria.garcia@tradeco.com', '+1-555-0124', 'We are looking for a reliable supplier of natural gas for our industrial operations.', 'contacted'),
('Ahmed Hassan', 'ahmed@energysolutions.com', '+1-555-0125', 'Please provide a quote for 1000 barrels of WTI crude oil.', 'resolved')
ON CONFLICT DO NOTHING;

-- Insert sample quote requests
INSERT INTO quote_requests (name, email, phone, company, product_category, product_details, quantity, delivery_location, additional_requirements, status) VALUES 
('Sarah Johnson', 'sarah@globalfoods.com', '+1-555-0126', 'Global Foods Inc', 'alimentary', 'Premium olive oil for retail distribution', '500 cases', 'New York, USA', 'Need organic certification', 'pending'),
('Roberto Silva', 'roberto@energyltd.com', '+1-555-0127', 'Energy Solutions Ltd', 'gas_oil', 'Diesel fuel for fleet operations', '10000 gallons', 'Miami, USA', 'Monthly delivery schedule required', 'processing'),
('Li Wei', 'li.wei@asiatrade.com', '+1-555-0128', 'Asia Trade Co', 'alimentary', 'Basmati rice for restaurant chain', '2000 kg', 'Los Angeles, USA', 'Premium grade required', 'quoted')
ON CONFLICT DO NOTHING;
